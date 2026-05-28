package handler

import (
	"image"
	"image/color"
	"image/jpeg"
	_ "image/png"
	"io"
	"net/http"
	"os"
	"path/filepath"

	"github.com/google/uuid"
	"golang.org/x/image/draw"
	_ "golang.org/x/image/webp"
)

const (
	maxUploadSize = 5 << 20 // 5 MB
	maxDimension  = 1200    // px — longest side
	jpegQuality   = 85
)

var allowedMIME = map[string]bool{
	"image/jpeg": true,
	"image/png":  true,
	"image/webp": true,
}

type UploadHandler struct {
	uploadsDir string
	baseURL    string
}

func NewUploadHandler(uploadsDir, baseURL string) *UploadHandler {
	os.MkdirAll(uploadsDir, 0755)
	return &UploadHandler{uploadsDir: uploadsDir, baseURL: baseURL}
}

// POST /api/v1/admin/upload
func (h *UploadHandler) Upload(w http.ResponseWriter, r *http.Request) {
	r.Body = http.MaxBytesReader(w, r.Body, maxUploadSize)
	if err := r.ParseMultipartForm(maxUploadSize); err != nil {
		writeError(w, http.StatusBadRequest, "file too large (max 5 MB)")
		return
	}

	file, _, err := r.FormFile("file")
	if err != nil {
		writeError(w, http.StatusBadRequest, "field 'file' is required")
		return
	}
	defer file.Close()

	// Detect MIME from first 512 bytes, then seek back
	buf := make([]byte, 512)
	n, _ := file.Read(buf)
	mime := http.DetectContentType(buf[:n])
	if _, err := file.Seek(0, io.SeekStart); err != nil {
		writeError(w, http.StatusInternalServerError, "failed to process file")
		return
	}
	if !allowedMIME[mime] {
		writeError(w, http.StatusBadRequest, "only jpeg, png, webp allowed")
		return
	}

	// Decode
	img, _, err := image.Decode(file)
	if err != nil {
		writeError(w, http.StatusBadRequest, "cannot decode image")
		return
	}

	// Resize if needed (only downscale, preserve aspect ratio)
	img = resizeIfNeeded(img, maxDimension)

	// Save as JPEG
	filename := uuid.New().String() + ".jpg"
	dst := filepath.Join(h.uploadsDir, filename)

	f, err := os.Create(dst)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to save file")
		return
	}
	defer f.Close()

	if err := jpeg.Encode(f, img, &jpeg.Options{Quality: jpegQuality}); err != nil {
		writeError(w, http.StatusInternalServerError, "failed to encode image")
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{
		"url": h.baseURL + "/uploads/" + filename,
	})
}

func resizeIfNeeded(src image.Image, maxPx int) image.Image {
	bounds := src.Bounds()
	w, h := bounds.Dx(), bounds.Dy()
	if w <= maxPx && h <= maxPx {
		return src
	}

	var newW, newH int
	if w >= h {
		newW = maxPx
		newH = h * maxPx / w
	} else {
		newH = maxPx
		newW = w * maxPx / h
	}
	if newH < 1 {
		newH = 1
	}
	if newW < 1 {
		newW = 1
	}

	dst := image.NewNRGBA(image.Rect(0, 0, newW, newH))
	// White background — JPEG не поддерживает прозрачность
	draw.Draw(dst, dst.Bounds(), image.NewUniform(color.White), image.Point{}, draw.Src)

	draw.CatmullRom.Scale(dst, dst.Bounds(), src, bounds, draw.Over, nil)
	return dst
}
