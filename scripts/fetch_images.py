#!/usr/bin/env python3
"""
Fetches product images from Ozon API and updates image_url in the DB.
Usage: python3 fetch_images.py <CLIENT_ID> <API_KEY>
"""
import sys
import json
import urllib.request
import urllib.error
import subprocess
import openpyxl

XLSX = 'Товары_01.07.2026.xlsx'
OZON_URL = 'https://api-seller.ozon.ru/v3/product/info/list'
BATCH = 100


def ozon_post(client_id, api_key, product_ids):
    body = json.dumps({'product_id': product_ids}).encode()
    req = urllib.request.Request(
        OZON_URL,
        data=body,
        headers={
            'Client-Id': client_id,
            'Api-Key': api_key,
            'Content-Type': 'application/json',
        },
        method='POST',
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read())


def run_sql(sql):
    proc = subprocess.run(
        ['docker', 'compose', 'exec', '-T', 'db',
         'psql', '-U', 'snabju', '-d', 'snabju'],
        input=sql.encode(),
        capture_output=True,
    )
    if proc.returncode != 0:
        print('SQL error:', proc.stderr.decode()[:300])
    return proc.returncode == 0


def main():
    if len(sys.argv) != 3:
        print('Usage: python3 fetch_images.py <CLIENT_ID> <API_KEY>')
        sys.exit(1)

    client_id, api_key = sys.argv[1], sys.argv[2]

    wb = openpyxl.load_workbook(XLSX)
    ws = wb.active

    # ozon_product_id -> sku mapping from xlsx
    ozon_to_sku = {}
    for row in ws.iter_rows(min_row=3, values_only=True):
        if not row[0]:
            continue
        ozon_id = row[1]  # Ozon Product ID
        sku = str(row[0]).strip()
        if ozon_id:
            ozon_to_sku[int(ozon_id)] = sku

    product_ids = list(ozon_to_sku.keys())
    print(f'Products to fetch: {len(product_ids)}')

    # fetch in batches
    sku_to_image = {}
    for i in range(0, len(product_ids), BATCH):
        batch = product_ids[i:i + BATCH]
        print(f'Fetching batch {i // BATCH + 1} ({len(batch)} items)...')
        try:
            data = ozon_post(client_id, api_key, batch)
            items = data.get('items', data.get('result', {}).get('items', []))
            for item in items:
                ozon_id = item.get('id')
                primary = item.get('primary_image', [])
                images = item.get('images', [])
                img = primary[0] if primary else (images[0] if images else None)
                if ozon_id and img and ozon_to_sku.get(ozon_id):
                    sku = ozon_to_sku[ozon_id]
                    sku_to_image[sku] = img
        except urllib.error.HTTPError as e:
            print(f'HTTP error: {e.code} {e.read().decode()[:200]}')
            sys.exit(1)

    print(f'Got images for {len(sku_to_image)} products')

    # build and apply SQL
    updates = []
    for sku, img_url in sku_to_image.items():
        safe_url = img_url.replace("'", "''")
        safe_sku = sku.replace("'", "''")
        updates.append(f"UPDATE products SET image_url = '{safe_url}' WHERE sku = '{safe_sku}';")

    if not updates:
        print('No images found, nothing to update')
        return

    sql = 'BEGIN;\n' + '\n'.join(updates) + '\nCOMMIT;\n'
    print(f'Applying {len(updates)} updates to DB...')
    if run_sql(sql):
        print('Done.')
    else:
        print('Failed. SQL saved to /tmp/image_updates.sql')
        with open('/tmp/image_updates.sql', 'w') as f:
            f.write(sql)


if __name__ == '__main__':
    main()
