const fs = require('fs');
const path = require('path');

const repoDir = process.cwd();
const outputFile = path.join(repoDir, 'index.html');

// Function to recursively find all HTML files
function findHtmlFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      findHtmlFiles(filePath, fileList);
    } else if (file.endsWith('.html') && file !== 'index.html') {
      // Exclude index.html itself to avoid self-referencing
      fileList.push(path.relative(repoDir, filePath));
    }
  });
  return fileList;
}

// Generate HTML content
function generateIndexHtml() {
  const htmlFiles = findHtmlFiles(repoDir);
  const links = htmlFiles
    .map(file => `<li><a href="${file}">${file}</a></li>`)
    .join('\n');

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Repository HTML Pages</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
        h1 {
            text-align: center;
        }
        ul {
            list-style-type: none;
            padding: 0;
        }
        li {
            margin: 10px 0;
        }
        a {
            text-decoration: none;
            color: #007bff;
        }
        a:hover {
            text-decoration: underline;
        }
    </style>
</head>
<body>
    <h1>HTML Pages in Repository</h1>
    <ul>
        ${links}
    </ul>
</body>
</html>
`;

  fs.writeFileSync(outputFile, htmlContent);
  console.log('Generated index.html with links to HTML files');
}

generateIndexHtml();