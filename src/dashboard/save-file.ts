// Hands a file made in the browser to the clinician as a download (the CSV export, a sheet's PDF).

export function saveFile(file: Blob, fileName: string) {
  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  // Freed a moment later, so the browser has started the download before the address goes away.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
