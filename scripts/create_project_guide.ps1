Add-Type -AssemblyName System.IO.Compression.FileSystem

$root = Split-Path -Parent $PSScriptRoot
$outputDir = Join-Path $root 'docs'
$outputFile = Join-Path $outputDir 'StockWatch_Project_Guide.docx'
$workDir = Join-Path $env:TEMP ('stockwatch-docx-' + [guid]::NewGuid())

New-Item -ItemType Directory -Force -Path $outputDir, $workDir, (Join-Path $workDir '_rels'), (Join-Path $workDir 'word'), (Join-Path $workDir 'word\_rels') | Out-Null

function Escape-Xml([string]$Text) {
  return [System.Security.SecurityElement]::Escape($Text)
}

function Paragraph([string]$Text, [string]$Style = 'Normal') {
  $escaped = Escape-Xml $Text
  return "<w:p><w:pPr><w:pStyle w:val=`"$Style`"/></w:pPr><w:r><w:t xml:space=`"preserve`">$escaped</w:t></w:r></w:p>"
}

function Bullet([string]$Text) {
  $escaped = Escape-Xml $Text
  return "<w:p><w:pPr><w:ind w:left=`"720`" w:hanging=`"360`"/></w:pPr><w:r><w:t>•</w:t><w:tab/><w:t xml:space=`"preserve`">$escaped</w:t></w:r></w:p>"
}

function Table([string[][]]$Rows) {
  $xml = '<w:tbl><w:tblPr><w:tblW w:w="0" w:type="auto"/><w:tblBorders><w:top w:val="single" w:sz="4" w:color="9BB7AF"/><w:left w:val="single" w:sz="4" w:color="9BB7AF"/><w:bottom w:val="single" w:sz="4" w:color="9BB7AF"/><w:right w:val="single" w:sz="4" w:color="9BB7AF"/><w:insideH w:val="single" w:sz="4" w:color="D5E2DD"/><w:insideV w:val="single" w:sz="4" w:color="D5E2DD"/></w:tblBorders></w:tblPr>'
  foreach ($row in $Rows) {
    $xml += '<w:tr>'
    foreach ($cell in $row) {
      $xml += "<w:tc><w:tcPr><w:tcW w:w=`"4500`" w:type=`"dxa`"/></w:tcPr>$(Paragraph $cell)</w:tc>"
    }
    $xml += '</w:tr>'
  }
  return $xml + '</w:tbl>'
}

$body = @()
$body += Paragraph 'StockWatch Project Guide' 'Title'
$body += Paragraph 'A simple guide for store owners, warehouse teams, managers, and new staff' 'Subtitle'
$body += Paragraph 'What this guide is for' 'Heading1'
$body += Paragraph 'StockWatch is an inventory management system. It helps a business know what products are available, what is running low, what has been sold, and what should be ordered again. This guide is written so that a person can use and understand the system without needing a developer beside them.'
$body += Paragraph 'The simple idea' 'Heading1'
$body += Paragraph 'Think of StockWatch as a digital stock book that updates itself. Instead of guessing how many items are left on a shelf or writing numbers in a notebook, your team records stock coming in and stock going out. StockWatch then shows the current quantity and warns you before important products run out.'
$body += Paragraph 'Who can use StockWatch' 'Heading1'
foreach ($item in @('Store owners who need to know what to buy and when.', 'Warehouse staff who receive goods, move goods, or record damaged items.', 'Sales staff who need to record products sold or returned.', 'Managers who need a quick view of stock value, low-stock items, and supplier needs.')) { $body += Bullet $item }
$body += Paragraph 'A real-life example: BrightMart Mini Store' 'Heading1'
$body += Paragraph 'BrightMart sells bottled water, soft drinks, snacks, phone chargers, and small electronics. Before StockWatch, the owner discovered empty shelves only after customers asked for an item. The owner also bought too much of slow-moving products because there was no clear record.'
$body += Paragraph 'With StockWatch, BrightMart creates each product once. For example, Bottled Water 75cl has a starting quantity of 120, a safety level of 30, and a supplier who normally delivers within 2 days. Every delivery is recorded as stock in. Every sale reduces the quantity. When the quantity gets close to 30, the Alerts page warns the team. The owner can then reorder before the shelf is empty.'
$body += Paragraph 'What each part of the system does' 'Heading1'
$body += Table @(
  @('Page or feature', 'What it helps you do'),
  @('Dashboard', 'See the big picture: total products, stock units, low-stock items, out-of-stock items, inventory value, and recent stock movement.'),
  @('Inventory', 'Add products, search for products, edit details, record sales, receive deliveries, record damage, and view stock status.'),
  @('Suppliers', 'Keep supplier names, contact information, delivery lead time, and the products they supply.'),
  @('Alerts', 'See products that are low, critical, or out of stock. Mark an alert as read after taking action.'),
  @('Reports', 'Review shortage predictions and reorder recommendations. Use the quick estimate when the forecasting service is not available.'),
  @('Stock movements', 'Keep a history of what changed: delivery, sale, return, damage, adjustment, or restock.')
)
$body += Paragraph 'Alert delivery: email and SMS' 'Heading1'
$body += Paragraph 'StockWatch keeps every low-stock alert inside the Alerts page. When the administrator enables alert delivery, the same alert can also be sent by email and SMS to every active user with the required contact details.'
$body += Table @(
  @('Delivery method', 'What the administrator must do'),
  @('Email', 'Add the organisation SMTP details in the server settings and enable email alerts.'),
  @('SMS in Nigeria', 'Create or fund a NigeriaBulkSMS portal account, save the portal username, password, and approved sender name in the server settings, then enable SMS alerts.'),
  @('Phone number', 'Users should save a Nigerian number as 080... or +234... in My Profile. StockWatch changes a valid local number to the format required by the SMS gateway.')
)
$body += Paragraph 'My Profile and user accounts' 'Heading1'
$body += Paragraph 'Every person should use their own account. Select the profile menu and open My Profile to update your name, email address, password, and alert phone number. This is especially important for an existing administrator whose account was created without a phone number.'
$body += Paragraph 'Only an administrator can open Manage users. There, the administrator can add new people, select a role, update contact details, reset a password, and disable an account when somebody should no longer use the system. Disabled users do not receive alerts.'
$body += Paragraph 'Getting started' 'Heading1'
$body += Paragraph '1. Open the StockWatch web address provided by your organisation. The first page introduces the system. Select Sign in.'
$body += Paragraph '2. Enter the email address and password provided by your administrator. For demonstration data only, the project can use admin@stockalert.com with password admin123. Change demo credentials before using the system for a real business.'
$body += Paragraph '3. Start on the Dashboard. Look first at Low Stock and Out of Stock. These figures tell you where attention is needed today.'
$body += Paragraph '4. Add suppliers and products before recording daily activity. Once products exist, use stock movements every time stock changes.'
$body += Paragraph 'Daily workflow example' 'Heading1'
$body += Table @(
  @('When this happens', 'What to record in StockWatch', 'Example'),
  @('A delivery arrives', 'Choose the product and record STOCK IN or RESTOCK with a positive quantity.', 'A supplier delivers 50 cartons of bottled water. Record +50.'),
  @('A customer buys something', 'Record SALE with a negative quantity if sales are not already connected from a point-of-sale system.', 'A customer buys 3 wireless mice. Record -3.'),
  @('An item is damaged', 'Record DAMAGED with a negative quantity and explain why in the note.', 'Two drink bottles break during unloading. Record -2 and note damaged on delivery.'),
  @('A customer returns an item', 'Record RETURN with a positive quantity if the item can be sold again.', 'One unused phone charger is returned. Record +1.'),
  @('A physical count is different', 'Record ADJUSTMENT and add a clear note explaining the difference.', 'Shelf count finds 4 fewer snack boxes than the system. Record -4 with the count date.'),
  @('A low-stock alert appears', 'Check the product, the supplier lead time, and the reorder recommendation. Place an order early enough for delivery.', 'Water has 28 units left, safety stock is 30, and delivery takes 2 days. Order now.')
)
$body += Paragraph 'How stock status works' 'Heading1'
$body += Paragraph 'In Stock means there is enough quantity for normal sales. Low Stock means the quantity has reached the minimum or safety level. Critical means the quantity is very low and needs quick action. Out of Stock means there is none left to sell. The exact status is calculated from the current quantity and the minimum stock level saved for the product.'
$body += Paragraph 'How to add a product correctly' 'Heading1'
foreach ($item in @('Use a clear product name that staff will recognise, such as Wireless Mouse or Bottled Water 75cl.', 'Add a unique SKU or item code, such as WM-001. This prevents confusion between similar products.', 'Enter the current quantity you have now. Count carefully before entering it.', 'Set a minimum or safety stock level. This is the quantity at which the system should warn you.', 'Attach the normal supplier and enter their usual delivery lead time when known.', 'Use a meaningful unit cost so the Dashboard inventory value is useful.')) { $body += Bullet $item }
$body += Paragraph 'Example product record' 'Heading1'
$body += Table @(
  @('Field', 'Example value', 'Why it matters'),
  @('Product name', 'Bottled Water 75cl', 'Staff can find the item easily.'),
  @('SKU', 'BW-075', 'Separates this item from other bottle sizes.'),
  @('Current stock', '120', 'Shows what is available right now.'),
  @('Minimum stock', '30', 'Triggers a warning before supply becomes a problem.'),
  @('Supplier lead time', '2 days', 'Helps StockWatch estimate when an order is needed.'),
  @('Unit cost', 'NGN 350', 'Helps calculate the value of stock held.')
)
$body += Paragraph 'Understanding reports and predictions' 'Heading1'
$body += Paragraph 'The Quick estimate uses recent sales and stock movement to estimate demand. The Detailed forecast can use the optional AI service to look for patterns over time. Both are decision aids, not promises. A manager should still consider upcoming holidays, promotions, supplier delays, weather, and local events before placing a large order.'
$body += Paragraph 'Example: A school resumption period may increase demand for bottled water, exercise books, and pens. Even if the normal forecast is low, the manager can order extra stock because they know demand will rise. StockWatch provides the evidence; local business knowledge completes the decision.'
$body += Paragraph 'Good habits that keep the numbers correct' 'Heading1'
foreach ($item in @('Record stock changes on the same day they happen.', 'Always add a short note for adjustments and damaged items.', 'Do a physical stock count regularly, for example once each week for fast-moving items and once each month for all items.', 'Check Alerts at the start of each working day.', 'Keep supplier contact details and delivery lead times up to date.', 'Do not delete a product just because it is temporarily out of stock. Keep its history unless the product has permanently left the business.')) { $body += Bullet $item }
$body += Paragraph 'Roles and permissions' 'Heading1'
$body += Paragraph 'Administrators manage user accounts and can delete products. Managers can add and edit products and suppliers. Staff use the operational parts of the system according to their assigned access. Use individual accounts rather than sharing one password so activity can be traced correctly.'
$body += Paragraph 'What to do when something looks wrong' 'Heading1'
$body += Table @(
  @('Problem', 'First thing to check'),
  @('The Dashboard does not load', 'Confirm the backend service is running and that the browser can reach the API address.'),
  @('A product quantity is wrong', 'Review the product movement history. Correct the quantity with an ADJUSTMENT and a clear note rather than changing numbers silently.'),
  @('A prediction is unavailable', 'Use the Quick estimate. The optional AI forecasting service may be offline, but normal inventory work can continue.'),
  @('You cannot sign in', 'Check the email and password. Ask an administrator to confirm your account is active.'),
  @('You cannot create or delete something', 'Your account may have staff-level permissions. Ask an administrator or manager for help.')
)
$body += Paragraph 'Technical setup for an administrator' 'Heading1'
$body += Paragraph 'The project has three parts: the React web client, the Node.js API with PostgreSQL database, and an optional Python forecasting service. PostgreSQL is required. Start the server, then the client. Start the Python service only when detailed forecasts are needed. The administrator can configure SMTP email and NigeriaBulkSMS SMS delivery in the server environment settings. The repository README and QUICKSTART document contain the full command-by-command setup instructions.'
$body += Paragraph 'Final checklist before daily use' 'Heading1'
foreach ($item in @('All products have correct names, SKUs, current quantities, and minimum stock levels.', 'Suppliers have correct contact details and delivery lead times.', 'Every active user has the correct email address and, if SMS alerts are needed, a Nigerian phone number.', 'SMTP and NigeriaBulkSMS delivery have been tested before relying on alerts.', 'The team knows how to record deliveries, sales, returns, damage, and adjustments.', 'Managers review Alerts and Reports daily or weekly.', 'Demo accounts and default passwords have been changed for real business use.')) { $body += Bullet $item }
$body += Paragraph 'StockWatch works best when it reflects reality. Record every important stock change, check alerts early, and use reports to make better purchasing decisions.'

$document = @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>$($body -join '')<w:sectPr><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="1100" w:right="1100" w:bottom="1100" w:left="1100"/></w:sectPr></w:body></w:document>
"@

$contentTypes = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/></Types>'
$relationships = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>'
$documentRelationships = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>'
$styles = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:docDefaults/><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:rPr><w:rFonts w:ascii="Aptos" w:hAnsi="Aptos"/><w:sz w:val="22"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:rPr><w:b/><w:color w:val="173D5B"/><w:sz w:val="44"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Subtitle"><w:name w:val="Subtitle"/><w:rPr><w:color w:val="397C73"/><w:sz w:val="24"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="Heading 1"/><w:pPr><w:spacing w:before="360" w:after="120"/></w:pPr><w:rPr><w:b/><w:color w:val="173D5B"/><w:sz w:val="30"/></w:rPr></w:style></w:styles>'

[System.IO.File]::WriteAllText((Join-Path $workDir '[Content_Types].xml'), $contentTypes, [System.Text.UTF8Encoding]::new($false))
[System.IO.File]::WriteAllText((Join-Path $workDir '_rels\.rels'), $relationships, [System.Text.UTF8Encoding]::new($false))
[System.IO.File]::WriteAllText((Join-Path $workDir 'word\document.xml'), $document, [System.Text.UTF8Encoding]::new($false))
[System.IO.File]::WriteAllText((Join-Path $workDir 'word\_rels\document.xml.rels'), $documentRelationships, [System.Text.UTF8Encoding]::new($false))
[System.IO.File]::WriteAllText((Join-Path $workDir 'word\styles.xml'), $styles, [System.Text.UTF8Encoding]::new($false))

[System.IO.Compression.ZipFile]::CreateFromDirectory($workDir, $outputFile)
Remove-Item -LiteralPath $workDir -Recurse -Force
Write-Output $outputFile
