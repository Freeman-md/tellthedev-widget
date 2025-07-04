import { config } from "./config.js";

let _formState: 'idle' | 'loading' | 'success' | 'error' = 'idle';
let apiKey: string | null = null;
let selectedType: 'bug' | 'idea' | 'praise' | 'general' | null = null;

window.addEventListener('message', (event) => {
  const { data } = event;

  if (data?.type === 'tellthedev:init' && data?.apiKey) {
    apiKey = data.apiKey;
    console.log('[TellTheDev] Widget initialized');
  }
});

document.addEventListener('DOMContentLoaded', () => {
  console.log('[TellTheDev] Widget DOM loaded');

  const form = document.querySelector('form') as HTMLFormElement;
  if (!form) return;

  setupTypeSelector();
  setupFormSubmit(form);
});

const setFormState = (newState: typeof _formState) => {
  _formState = newState;
  updateFormUI(newState);
};

const updateFormUI = (state: typeof _formState) => {
  const submitBtn = document.querySelector("button[type='submit']") as HTMLButtonElement;
  if (!submitBtn) return;

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

const showErrorAlert = (message: string) => {
  const alertEl = document.getElementById("form-error-alert");
  if (!alertEl) return;

  alertEl.textContent = message;
  alertEl.classList.remove("hidden");

  setTimeout(() => {
    alertEl.classList.add("hidden");
  }, 4000);
};

const setupTypeSelector = () => {
  const typeButtons = document.querySelectorAll('[data-type]') as NodeListOf<HTMLButtonElement>;

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

const setupFormSubmit = (form: HTMLFormElement) => {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!apiKey) {
      alert('Widget is not initialized. No API key.');
      return;
    }

    await handleFormSubmission(apiKey);
  });
};

const handleFormSubmission = async (apiKey: string) => {
  setFormState("loading");

  const contentEl = document.querySelector("textarea") as HTMLTextAreaElement;
  const content = contentEl?.value.trim();

  const contentErrorEl = document.getElementById("content-error");
  const typeErrorEl = document.getElementById("type-error");

  if (contentErrorEl) contentErrorEl.textContent = "";
  if (typeErrorEl) typeErrorEl.textContent = "";

  let hasError = false;

  if (!content) {
    if (contentErrorEl) contentErrorEl.textContent = "Please enter a message";
    hasError = true;
  }

  if (!selectedType) {
    if (typeErrorEl) typeErrorEl.textContent = "Please select a feedback type";
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

    if (!response.ok) {
      setFormState("error");

      if (result?.data?.content) {
        if (contentErrorEl) contentErrorEl.textContent = result.data.content;
      }

      showErrorAlert(result?.message || "Something went wrong. Please try again.");
      return;
    }

    console.log("[TellTheDev] Submission successful:", result);
    setFormState("success");

    contentEl.value = "";
    selectedType = null;

    const typeButtons = document.querySelectorAll('[data-type]') as NodeListOf<HTMLButtonElement>;
    typeButtons.forEach(btn => btn.classList.remove('bg-blue-600', 'text-white', 'hover:bg-blue-600', 'active'));
  } catch (error: unknown) {
    if (error instanceof Error) {
      showErrorAlert(error.message || "Submission failed. Please try again.");
    }
    setFormState("error");
  } finally {
    setTimeout(() => {
      setFormState('idle');
    }, 3000);
  }
};
