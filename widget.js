"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
let _formState = 'idle';
let projectId = "8d62d581-6853-49be-b788-e317c297509e";
let selectedType = null;
window.addEventListener('message', (event) => {
    const { data } = event;
    if ((data === null || data === void 0 ? void 0 : data.type) === 'tellthedev:init' && (data === null || data === void 0 ? void 0 : data.projectId)) {
        projectId = data.projectId;
        console.log('[TellTheDev] Widget initialized with project ID:', projectId);
    }
});
document.addEventListener('DOMContentLoaded', () => {
    console.log('[TellTheDev] Widget DOM loaded');
    const form = document.querySelector('form');
    if (!form)
        return;
    setupTypeSelector();
    setupFormSubmit(form);
});
const setFormState = (newState) => {
    _formState = newState;
    updateFormUI(newState);
};
const updateFormUI = (state) => {
    const submitBtn = document.querySelector("button[type='submit']");
    if (!submitBtn)
        return;
    switch (state) {
        case 'idle':
            submitBtn.disabled = false;
            submitBtn.textContent = 'Submit feedback';
            break;
        case 'loading':
            submitBtn.disabled = true;
            submitBtn.textContent = 'Submitting...';
            break;
        case 'success':
            submitBtn.disabled = false;
            submitBtn.textContent = 'Submitted ✅';
            break;
        case 'error':
            submitBtn.disabled = false;
            submitBtn.textContent = 'Try Again';
            break;
        default:
            break;
    }
};
const showErrorAlert = (message) => {
    const alertEl = document.getElementById("form-error-alert");
    if (!alertEl)
        return;
    alertEl.textContent = message;
    alertEl.classList.remove("hidden");
    setTimeout(() => {
        alertEl.classList.add("hidden");
    }, 4000);
};
const setupTypeSelector = () => {
    const typeButtons = document.querySelectorAll('[data-type]');
    typeButtons.forEach((btn) => {
        btn.addEventListener('click', () => {
            const value = btn.getAttribute('data-type');
            if (value === 'bug' || value === 'feature' || value === 'general') {
                selectedType = value;
                typeButtons.forEach((b) => {
                    b.classList.remove('bg-blue-600', 'text-white', 'hover:bg-blue-600');
                });
                btn.classList.add('bg-blue-600', 'text-white', 'hover:bg-blue-600');
            }
        });
    });
};
const setupFormSubmit = (form) => {
    form.addEventListener('submit', (e) => __awaiter(void 0, void 0, void 0, function* () {
        e.preventDefault();
        // if (!projectId) {
        //     alert('Widget is not initialized. No project ID.');
        //     return;
        // }
        yield handleFormSubmission(projectId);
    }));
};
const handleFormSubmission = (projectId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    setFormState("loading");
    const messageEl = document.querySelector("textarea");
    const imageEl = document.querySelector('input[type="file"]');
    const messageErrorEl = document.getElementById("message-error");
    const imageErrorEl = document.getElementById("image-error");
    const typeErrorEl = document.getElementById("type-error");
    // Clear previous errors
    if (messageErrorEl)
        messageErrorEl.textContent = "";
    if (imageErrorEl)
        imageErrorEl.textContent = "";
    if (typeErrorEl)
        typeErrorEl.textContent = "";
    const message = messageEl === null || messageEl === void 0 ? void 0 : messageEl.value.trim();
    const image = (_b = (_a = imageEl.files) === null || _a === void 0 ? void 0 : _a[0]) !== null && _b !== void 0 ? _b : null;
    let hasError = false;
    if (!message) {
        if (messageErrorEl)
            messageErrorEl.textContent = "Please enter a message";
        hasError = true;
    }
    if (!selectedType) {
        if (typeErrorEl)
            typeErrorEl.textContent = "Please select a feedback type";
        hasError = true;
    }
    if (hasError) {
        console.warn("[TellTheDev] Submission blocked due to validation errors.");
        setFormState("idle");
        return;
    }
    try {
        const formData = new FormData();
        formData.append("projectId", projectId);
        formData.append("type", selectedType);
        formData.append("message", message);
        if (image) {
            const compressedImage = yield imageCompression(image, {
                maxSizeMB: 1,
                maxWidthOrHeight: 1280,
                useWebWorker: true,
            });
            formData.append("image", compressedImage, image.name);
        }
        const response = yield fetch("http://127.0.0.1:54321/functions/v1/submit-feedback", {
            method: "POST",
            body: formData,
        });
        const result = yield response.json();
        if (!response.ok) {
            setFormState("error");
            showErrorAlert((result === null || result === void 0 ? void 0 : result.error) || "Something went wrong. Please try again.");
            return;
        }
        console.log("[TellTheDev] Submission successful:", result);
        setFormState("success");
        // TODO: reset form or show success message
    }
    catch (error) {
        console.log(error);
        if (error instanceof Error) {
            showErrorAlert(error.message || "Submission failed. Please try again.");
        }
        setFormState("error");
    }
    finally {
        setTimeout(() => {
            setFormState('idle');
        }, 3000);
    }
});
