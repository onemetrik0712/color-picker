// ============================================
// DOM Elements
// ============================================
const uploadArea = document.getElementById('uploadArea');
const uploadButton = document.getElementById('uploadButton');
const fileInput = document.getElementById('fileInput');
const imageCanvas = document.getElementById('imageCanvas');
const viewerContainer = document.getElementById('viewerContainer');
const viewerHint = document.getElementById('viewerHint');
const clearButton = document.getElementById('clearButton');
const resultsCard = document.getElementById('resultsCard');
const resultsContent = document.querySelector('.results-content');
const resultsPlaceholder = document.getElementById('resultsPlaceholder');
const colorSwatch = document.getElementById('colorSwatch');
const hexInput = document.getElementById('hexInput');
const rgbValue = document.getElementById('rgbValue');
const copyButton = document.getElementById('copyButton');
const toast = document.getElementById('toast');

// ============================================
// Global State
// ============================================
let currentImage = null;
let canvasContext = null;

// ============================================
// Initialize Canvas Context
// ============================================
canvasContext = imageCanvas.getContext('2d', { willReadFrequently: true });

// ============================================
// Upload Functionality
// ============================================

// Browse button click handler
uploadButton.addEventListener('click', (e) => {
    e.stopPropagation(); // Prevent event bubbling to upload area
    fileInput.click();
});

// Upload area click handler
uploadArea.addEventListener('click', (e) => {
    if (e.target === uploadArea || e.target.closest('.upload-area')) {
        fileInput.click();
    }
});

// File input change handler
fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        handleFile(file);
    }
});

// Drag and drop handlers
uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.stopPropagation();
    uploadArea.classList.add('drag-over');
});

uploadArea.addEventListener('dragleave', (e) => {
    e.preventDefault();
    e.stopPropagation();
    uploadArea.classList.remove('drag-over');
});

uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    e.stopPropagation();
    uploadArea.classList.remove('drag-over');

    const files = e.dataTransfer.files;
    if (files.length > 0) {
        const file = files[0];
        if (file.type.match(/^image\/(jpeg|png)$/)) {
            handleFile(file);
        } else {
            showToast('Please upload a JPEG or PNG image', 'error');
        }
    }
});

// ============================================
// File Processing
// ============================================

/**
 * Handles the uploaded image file
 * @param {File} file - The image file to process
 */
function handleFile(file) {
    // Validate file type
    if (!file.type.match(/^image\/(jpeg|png)$/)) {
        showToast('Please upload a JPEG or PNG image', 'error');
        return;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
        showToast('Image size must be less than 10MB', 'error');
        return;
    }

    // Read the file
    const reader = new FileReader();

    reader.onload = (e) => {
        loadImage(e.target.result);
    };

    reader.onerror = () => {
        showToast('Error reading file', 'error');
    };

    reader.readAsDataURL(file);
}

/**
 * Loads and displays the image on the canvas
 * @param {string} dataUrl - The image data URL
 */
function loadImage(dataUrl) {
    const img = new Image();

    img.onload = () => {
        currentImage = img;
        renderImageToCanvas(img);
        showImageViewer();
        hideResults();
    };

    img.onerror = () => {
        showToast('Error loading image', 'error');
    };

    img.src = dataUrl;
}

/**
 * Renders the image to the canvas with proper scaling
 * @param {Image} img - The image element to render
 */
function renderImageToCanvas(img) {
    // Get container dimensions
    const containerWidth = viewerContainer.clientWidth;
    const containerHeight = 400; // Max height for viewer

    // Calculate scaling to fit within container while maintaining aspect ratio
    const imgAspectRatio = img.width / img.height;
    const containerAspectRatio = containerWidth / containerHeight;

    let canvasWidth, canvasHeight;

    if (imgAspectRatio > containerAspectRatio) {
        // Image is wider than container
        canvasWidth = Math.min(img.width, containerWidth);
        canvasHeight = canvasWidth / imgAspectRatio;
    } else {
        // Image is taller than container
        canvasHeight = Math.min(img.height, containerHeight);
        canvasWidth = canvasHeight * imgAspectRatio;
    }

    // Set canvas dimensions
    imageCanvas.width = canvasWidth;
    imageCanvas.height = canvasHeight;

    // Draw image on canvas
    canvasContext.drawImage(img, 0, 0, canvasWidth, canvasHeight);

    // Show canvas
    imageCanvas.classList.add('active');
}

/**
 * Shows the image viewer and hides the placeholder
 */
function showImageViewer() {
    const placeholder = viewerContainer.querySelector('.viewer-placeholder');
    if (placeholder) {
        placeholder.style.display = 'none';
    }
    viewerHint.classList.add('active');
}

/**
 * Hides the image viewer and shows the placeholder
 */
function hideImageViewer() {
    const placeholder = viewerContainer.querySelector('.viewer-placeholder');
    if (placeholder) {
        placeholder.style.display = 'block';
    }
    imageCanvas.classList.remove('active');
    viewerHint.classList.remove('active');
}

// ============================================
// Color Picking Functionality
// ============================================

/**
 * Canvas click handler to extract color
 */
imageCanvas.addEventListener('click', (e) => {
    if (!currentImage) return;

    // Get click coordinates relative to canvas
    const rect = imageCanvas.getBoundingClientRect();
    const scaleX = imageCanvas.width / rect.width;
    const scaleY = imageCanvas.height / rect.height;

    const x = Math.floor((e.clientX - rect.left) * scaleX);
    const y = Math.floor((e.clientY - rect.top) * scaleY);

    // Extract pixel data
    const pixelData = canvasContext.getImageData(x, y, 1, 1).data;

    // Get RGB values
    const r = pixelData[0];
    const g = pixelData[1];
    const b = pixelData[2];
    const a = pixelData[3];

    // Handle transparent pixels
    if (a === 0) {
        showToast('This pixel is transparent', 'info');
        return;
    }

    // Convert to hex
    const hexColor = rgbToHex(r, g, b);

    // Display results
    displayColorResult(hexColor, r, g, b);
});

/**
 * Converts RGB values to hex color code
 * @param {number} r - Red value (0-255)
 * @param {number} g - Green value (0-255)
 * @param {number} b - Blue value (0-255)
 * @returns {string} Hex color code
 */
function rgbToHex(r, g, b) {
    const toHex = (value) => {
        const hex = value.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    };

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

/**
 * Displays the color result in the results card
 * @param {string} hex - Hex color code
 * @param {number} r - Red value
 * @param {number} g - Green value
 * @param {number} b - Blue value
 */
function displayColorResult(hex, r, g, b) {
    // Update color swatch
    colorSwatch.style.backgroundColor = hex;

    // Update hex input
    hexInput.value = hex;

    // Update RGB display
    rgbValue.textContent = `${r}, ${g}, ${b}`;

    // Show results
    showResults();
}

/**
 * Shows the results section
 */
function showResults() {
    resultsPlaceholder.classList.add('hidden');
    resultsContent.classList.add('active');
}

/**
 * Hides the results section
 */
function hideResults() {
    resultsPlaceholder.classList.remove('hidden');
    resultsContent.classList.remove('active');
}

// ============================================
// Copy to Clipboard Functionality
// ============================================

/**
 * Copy button click handler
 */
copyButton.addEventListener('click', async () => {
    const hexValue = hexInput.value;

    try {
        await navigator.clipboard.writeText(hexValue);
        showToast('Copied to clipboard!', 'success');
    } catch (err) {
        // Fallback for older browsers
        fallbackCopyToClipboard(hexValue);
    }
});

/**
 * Fallback copy method for older browsers
 * @param {string} text - Text to copy
 */
function fallbackCopyToClipboard(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    document.body.appendChild(textArea);
    textArea.select();

    try {
        document.execCommand('copy');
        showToast('Copied to clipboard!', 'success');
    } catch (err) {
        showToast('Failed to copy', 'error');
    }

    document.body.removeChild(textArea);
}

// Also allow clicking on hex input to copy
hexInput.addEventListener('click', () => {
    hexInput.select();
});

// ============================================
// Clear Functionality
// ============================================

/**
 * Clear button click handler
 */
clearButton.addEventListener('click', () => {
    currentImage = null;
    fileInput.value = '';
    canvasContext.clearRect(0, 0, imageCanvas.width, imageCanvas.height);
    hideImageViewer();
    hideResults();
});

// ============================================
// Toast Notifications
// ============================================

/**
 * Shows a toast notification
 * @param {string} message - The message to display
 * @param {string} type - The type of toast (success, error, info)
 */
function showToast(message, type = 'success') {
    const toastMessage = toast.querySelector('.toast-message');
    const toastIcon = toast.querySelector('.toast-icon');

    // Update message
    toastMessage.textContent = message;

    // Update icon based on type
    if (type === 'error') {
        toast.style.background = '#ef4444';
        toastIcon.innerHTML = '<path d="M6 18L18 6M6 6l12 12"></path>';
    } else if (type === 'info') {
        toast.style.background = '#3b82f6';
        toastIcon.innerHTML = '<circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line>';
    } else {
        toast.style.background = '#10b981';
        toastIcon.innerHTML = '<polyline points="20 6 9 17 4 12"></polyline>';
    }

    // Show toast
    toast.classList.add('show');

    // Hide after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// ============================================
// Responsive Canvas Resize
// ============================================

/**
 * Handles window resize to adjust canvas
 */
let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        if (currentImage) {
            renderImageToCanvas(currentImage);
        }
    }, 250);
});

// ============================================
// Keyboard Shortcuts
// ============================================

/**
 * Handle keyboard shortcuts
 */
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + V to paste image from clipboard
    if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        navigator.clipboard.read().then(items => {
            for (const item of items) {
                for (const type of item.types) {
                    if (type.startsWith('image/')) {
                        item.getType(type).then(blob => {
                            handleFile(blob);
                        });
                    }
                }
            }
        }).catch(() => {
            // Clipboard API not supported or no permission
        });
    }

    // Escape to clear
    if (e.key === 'Escape' && currentImage) {
        clearButton.click();
    }
});

// ============================================
// Initialize
// ============================================

console.log('Color Picker initialized successfully!');
console.log('Features:');
console.log('- Upload images via drag & drop or file picker');
console.log('- Click anywhere on the image to extract color');
console.log('- Copy hex codes to clipboard');
console.log('- Keyboard shortcuts: Ctrl+V (paste image), Escape (clear)');
