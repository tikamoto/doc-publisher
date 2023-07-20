import { parse as csvparse } from 'csv-parse/sync';
import * as fs from 'fs';
import { JSDOM } from "jsdom";
import { marked } from "marked";
import * as path from 'path';
import { AppConfig, FileInfo } from './types';

const config: AppConfig = JSON.parse(fs.readFileSync('./app.json', 'utf-8'))

const listFiles = (dir: string, ext: string): FileInfo[] => {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((dirent: fs.Dirent): FileInfo[] => {
    if (dirent.isFile()) {
        return (new RegExp(`.*\.${ext}$`)).test(dirent.name) ? [{
            filePath: `${dir}/${dirent.name}`,
            fileName: dirent.name,
            logicalName: dirent.name.substring(0, dirent.name.indexOf('.'))
        }] : []
    } else {
        return listFiles(`${dir}/${dirent.name}`, ext)
    }
  })
}

const makeDirFromFilePath = (filePath: string) => {
    const dirPath = filePath.substring(0, filePath.lastIndexOf('/'));
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}

const copyFile = (srcFilePath: string, distFilePath: string) => {
    makeDirFromFilePath(distFilePath);
    fs.copyFileSync(srcFilePath, distFilePath);
}

const writeFile = (distFilePath: string, content: string) => {
    makeDirFromFilePath(distFilePath);
    fs.writeFileSync(distFilePath, content);
}

const assignPageTemplate = (() => {
    const template = (() => {
        const baseTemplate = fs.readFileSync('./assets/page.html', 'utf-8');
        const index = fs.readFileSync(`${config.srcDir}/index.md`, 'utf-8');
        const sideHtml = marked.parse(index, {mangle: false, headerIds: false, breaks: true});
        const dom = new JSDOM(baseTemplate)
        dom.window.document.querySelector('aside nav')!.innerHTML = sideHtml;
        return dom.serialize()
    })()
    return (html: string, filePath: string): string => {
        const dom = new JSDOM(template)
        dom.window.document.querySelector('.markdown-body')!.innerHTML = html;
        dom.window.document.querySelectorAll('aside nav a')?.forEach((elem) => {
            const href = elem.getAttribute('href') || '';
            if (href.match(/^(http|https):/)) return
            const to = path.posix.join(config.distDir, decodeURI(href))
            const relativeLink = path.posix.relative(filePath, to).replace(/^..\//, './')
            elem.setAttribute('href', encodeURI(relativeLink))
        })
        return dom.serialize();
    }
})()

const assignViewerTemplate = (() => {
    const template = fs.readFileSync('./assets/viewer.html', 'utf-8')
    return (imgPath: string): string => {
        const dom = new JSDOM(template)
        dom.window.document.querySelector('.view-area')!.innerHTML = `<img src="${imgPath}">`;
        return dom.serialize();
    }
})()

const exchangeDistFilePath = (srcFilePath: string): string => {
    return srcFilePath.replace(new RegExp(`^${config.srcDir}/(.*)$`), `${config.distDir}/$1`)
}

const main = () => {

    console.log('✔ Initializing...')
    fs.rmSync(config.distDir, { recursive: true, force: true })
    copyFile('./assets/.htaccess', `${config.distDir}/.htaccess`)

    //markdown⇒html変換
    console.log('✔ Converting markdown to html...')
    listFiles(config.srcDir, 'md').forEach(({ filePath }) => {
        const markdown = fs.readFileSync(filePath, 'utf-8');
        const html = marked.parse(markdown, {mangle: false, headerIds: false, breaks: true});
        writeFile(
            exchangeDistFilePath(`${filePath}.html`),
            assignPageTemplate(html, exchangeDistFilePath(`${filePath}.html`))
        )
    })

    //csv⇒html変換
    console.log('✔ Converting csv to html...')
    listFiles(config.srcDir, 'csv').forEach(({ filePath, logicalName }) => {
        const csv = csvparse(fs.readFileSync(filePath, 'utf-8'));
        const html = (() => {
            let rows: string = ''
            csv.forEach((line: string[], index: number) => {
                rows += '<tr>'
                line.forEach((col: string) => {
                    rows += index == 0 ? `<th>${col}</th>` : `<td>${col}</td>`
                })
                rows += '</tr>'
            })
            return `
                <h1>${logicalName}</h1>
                <table>${rows}</table>
            `
        })()
        writeFile(
            exchangeDistFilePath(`${filePath}.html`),
            assignPageTemplate(html, exchangeDistFilePath(`${filePath}.html`))
        )
    })

    //svg⇒コピー&ビューア生成
    console.log('✔ Converting svg to html...')
    listFiles(config.srcDir, 'svg').forEach(({ filePath, fileName }) => {
        const distFilePath = exchangeDistFilePath(filePath)
        copyFile(filePath, distFilePath)
        writeFile(
            `${distFilePath}.html`,
            assignViewerTemplate(fileName)
        )
    })

    console.log('✔ Build succeeded')
}

main()