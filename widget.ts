declare const imageCompression: any;

let _formState: 'idle' | 'loading' | 'success' | 'error' = 'idle'
let projectId: string | null = "8d62d581-6853-49be-b788-e317c297509e";
let selectedType: 'bug' | 'feature' | 'general' | null = null;

window.addEventListener('message', (event) => {
  const { data } = event;

  if (data?.type === 'tellthedev:init' && data?.projectId) {
    projectId = data.projectId;
    console.log('[TellTheDev] Widget initialized with project ID:', projectId);
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
  _formState = newState
  updateFormUI(newState)
}

const updateFormUI = (state: typeof _formState) => {
  const submitBtn = document.querySelector("button[type='submit']") as HTMLButtonElement

  if (!submitBtn) return;

  switch (state) {
    case 'idle':
      submitBtn.disabled = false;
      submitBtn.textContent = 'Submit feedback'
      break;
    case 'loading':
      submitBtn.disabled = true;
      submitBtn.textContent = 'Submitting...'
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
}

const showErrorAlert = (message: string) => {
  const alertEl = document.getElementById("form-error-alert");
  if (!alertEl) return;

  alertEl.textContent = message;
  alertEl.classList.remove("hidden");

  setTimeout(() => {
    alertEl.classList.add("hidden");
  }, 4000);
}


const setupTypeSelector = () => {
  const typeButtons = document.querySelectorAll('[data-type]') as NodeListOf<HTMLButtonElement>;

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
}

const setupFormSubmit = (form: HTMLFormElement) => {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!projectId) {
        alert('Widget is not initialized. No project ID.');
        return;
    }

    await handleFormSubmission(projectId!);
  });
}

const handleFormSubmission = async (projectId: string) => {
  setFormState("loading");

  const messageEl = document.querySelector("textarea") as HTMLTextAreaElement;
  const imageEl = document.querySelector('input[type="file"]') as HTMLInputElement;

  const messageErrorEl = document.getElementById("message-error");
  const imageErrorEl = document.getElementById("image-error");
  const typeErrorEl = document.getElementById("type-error");

  // Clear previous errors
  if (messageErrorEl) messageErrorEl.textContent = "";
  if (imageErrorEl) imageErrorEl.textContent = "";
  if (typeErrorEl) typeErrorEl.textContent = "";

  const message = messageEl?.value.trim();
  const image = imageEl.files?.[0] ?? null;

  let hasError = false;

  if (!message) {
    if (messageErrorEl) messageErrorEl.textContent = "Please enter a message";
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
    const formData = new FormData();
    formData.append("projectId", projectId);
    formData.append("type", selectedType!);
    formData.append("message", message);

    if (image) {
      const compressedImage = await imageCompression(image, {
        maxSizeMB: 1,
        maxWidthOrHeight: 1280,
        useWebWorker: true,
      });
      formData.append("image", compressedImage, image.name);
    }

    const response = await fetch("http://127.0.0.1:54321/functions/v1/submit-feedback", {
      method: "POST",
      body: formData,
    });

    const result = await response.json();

    if (!response.ok) {
      setFormState("error");
      showErrorAlert(result?.error || "Something went wrong. Please try again.");

      return;
    }

    console.log("[TellTheDev] Submission successful:", result);
    setFormState("success");

    // TODO: reset form or show success message
  } catch (error: unknown) {
    console.log(error)
    if (error instanceof Error ) {
      showErrorAlert(error.message || "Submission failed. Please try again.");
    }

    setFormState("error");
  } finally {
    setTimeout(() => {
        setFormState('idle')
      }, 3000);
  }
};
