const documentWrapperElement = document.getElementById('document-wrapper');

function openDocument() {
    documentWrapperElement.classList.remove('hide');
}

function closeDocument() {
    documentWrapperElement.classList.add('hide');
}
