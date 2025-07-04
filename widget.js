import { config } from "./config.js";
let _formState = 'idle';
let apiKey = null;
let selectedType = null;
window.addEventListener('message', (event) => {
    const { data } = event;
    if ((data === null || data === void 0 ? void 0 : data.type) === 'tellthedev:init' && (data === null || data === void 0 ? void 0 : data.apiKey)) {
        apiKey = data.apiKey;
        console.log('[TellTheDev] Widget initialized');
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
            if (value === 'bug' || value === 'idea' || value === 'praise' || value === 'general') {
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
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!apiKey) {
            alert('Widget is not initialized. No API key.');
            return;
        }
        await handleFormSubmission(apiKey);
    });
};
const handleFormSubmission = async (apiKey) => {
    var _a;
    setFormState("loading");
    const contentEl = document.querySelector("textarea");
    const content = contentEl === null || contentEl === void 0 ? void 0 : contentEl.value.trim();
    const contentErrorEl = document.getElementById("content-error");
    const typeErrorEl = document.getElementById("type-error");
    if (contentErrorEl)
        contentErrorEl.textContent = "";
    if (typeErrorEl)
        typeErrorEl.textContent = "";
    let hasError = false;
    if (!content) {
        if (contentErrorEl)
            contentErrorEl.textContent = "Please enter a message";
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
        const response = await fetch(`${config.apiUrl}/submit-feedback`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                type: selectedType,
                content
            })
        });
        const result = await response.json();
        console.log(result, response.ok);
        if (!response.ok) {
            setFormState("error");
            console.log(result);
            if ((_a = result === null || result === void 0 ? void 0 : result.data) === null || _a === void 0 ? void 0 : _a.content) {
                if (contentErrorEl)
                    contentErrorEl.textContent = result.data.content;
            }
            showErrorAlert((result === null || result === void 0 ? void 0 : result.message) || "Something went wrong. Please try again.");
            return;
        }
        console.log("[TellTheDev] Submission successful:", result);
        setFormState("success");
        contentEl.value = "";
        selectedType = null;
        const typeButtons = document.querySelectorAll('[data-type]');
        typeButtons.forEach(btn => btn.classList.remove('bg-blue-600', 'text-white', 'hover:bg-blue-600', 'active'));
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
};
