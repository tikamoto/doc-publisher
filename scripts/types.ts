export type AppConfig = {
    srcDir: string,
    distDir: string,
    server: ServerConfig
}
export type ServerConfig = {
    host: string,
    port: number,
    username: string,
    deployTo: string
}
export type FileInfo = {
    filePath: string,
    fileName: string,
    logicalName: string
}