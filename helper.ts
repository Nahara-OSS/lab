/**
 * Request user to select a file and return `File`/`Blob`.
 * @returns A promise that will resolves to `File`, or rejects if user canceled in file upload dialog.
 */
export function requestFileBlob(): Promise<File> {
    return new Promise((resolve, reject) => {
        const e = document.createElement("input");
        e.type = "file";
        e.addEventListener("input", () => {
            if (e.files == null || e.files.length == 0) {
                reject("No file selected by user");
                return;
            }

            resolve(e.files[0]);
        });
        e.addEventListener("cancel", () => reject("No file selected by user"));
        e.click();
    });
}