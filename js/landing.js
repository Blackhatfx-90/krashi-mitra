/* ============================================
   KISAN SATHI — Main JavaScript
   Navigation, Password Toggle, Form Validation
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  initMobileNav();
  initPasswordToggles();
  initFormValidation();
  initSmoothScroll();
  initNavbarScroll();
});

/* ---------- Mobile Navigation ---------- */
function initMobileNav() {
  const hamburger = document.getElementById('navbar-hamburger');
  const mobileMenu = document.getElementById('navbar-mobile-menu');

  if (!hamburger || !mobileMenu) return;

  hamburger.addEventListener('click', () => {
    const isOpen = hamburger.classList.toggle('active');
    mobileMenu.classList.toggle('active');
    hamburger.setAttribute('aria-expanded', isOpen);
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });

  // Close menu when a link is clicked
  mobileMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      hamburger.classList.remove('active');
      mobileMenu.classList.remove('active');
      hamburger.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    });
  });

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && mobileMenu.classList.contains('active')) {
      hamburger.classList.remove('active');
      mobileMenu.classList.remove('active');
      hamburger.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }
  });
}

/* ---------- Password Toggle ---------- */
function initPasswordToggles() {
  const toggleButtons = document.querySelectorAll('.form-group__toggle-password');

  toggleButtons.forEach(button => {
    button.addEventListener('click', () => {
      const input = button.parentElement.querySelector('input');
      if (!input) return;

      const isPassword = input.type === 'password';
      input.type = isPassword ? 'text' : 'password';

      // Update icon
      const eyeOpen = button.querySelector('.icon-eye-open');
      const eyeClosed = button.querySelector('.icon-eye-closed');

      if (eyeOpen && eyeClosed) {
        eyeOpen.style.display = isPassword ? 'none' : 'block';
        eyeClosed.style.display = isPassword ? 'block' : 'none';
      }

      // Update aria-label
      button.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');
    });
  });
}

/* ---------- Form Validation ---------- */
function initFormValidation() {
  const forms = document.querySelectorAll('.auth-form');

  forms.forEach(form => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      let isValid = true;

      // Reset errors
      form.querySelectorAll('.form-group').forEach(group => {
        group.classList.remove('form-group--error');
      });

      // Validate required fields
      const requiredInputs = form.querySelectorAll('[required]');
      requiredInputs.forEach(input => {
        const group = input.closest('.form-group');
        if (!input.value.trim()) {
          if (group) group.classList.add('form-group--error');
          isValid = false;
        }
      });

      // Validate phone number
      const phoneInput = form.querySelector('input[type="tel"]');
      if (phoneInput && phoneInput.value.trim()) {
        const phoneRegex = /^[6-9]\d{9}$/;
        if (!phoneRegex.test(phoneInput.value.trim())) {
          const group = phoneInput.closest('.form-group');
          if (group) {
            group.classList.add('form-group--error');
            const error = group.querySelector('.form-group__error');
            if (error) error.textContent = 'Please enter a valid 10-digit phone number';
          }
          isValid = false;
        }
      }

      // Validate email
      const emailInput = form.querySelector('input[type="email"]');
      if (emailInput && emailInput.value.trim()) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(emailInput.value.trim())) {
          const group = emailInput.closest('.form-group');
          if (group) {
            group.classList.add('form-group--error');
            const error = group.querySelector('.form-group__error');
            if (error) error.textContent = 'Please enter a valid email address';
          }
          isValid = false;
        }
      }

      // Validate password match (signup)
      const password = form.querySelector('#signup-password');
      const confirmPassword = form.querySelector('#signup-confirm-password');
      if (password && confirmPassword && password.value !== confirmPassword.value) {
        const group = confirmPassword.closest('.form-group');
        if (group) {
          group.classList.add('form-group--error');
          const error = group.querySelector('.form-group__error');
          if (error) error.textContent = 'Passwords do not match';
        }
        isValid = false;
      }

      // Validate terms checkbox (signup)
      const termsCheckbox = form.querySelector('#terms-agree');
      if (termsCheckbox && !termsCheckbox.checked) {
        isValid = false;
        const label = termsCheckbox.closest('.auth-checkbox');
        if (label) label.style.color = '#D32F2F';
      }

      if (isValid) {
        // Show success feedback
        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) {
          const originalText = submitBtn.textContent;
          submitBtn.textContent = 'Processing...';
          submitBtn.disabled = true;

          setTimeout(() => {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
          }, 1500);
        }
      }
    });

    // Clear error on input
    form.querySelectorAll('input').forEach(input => {
      input.addEventListener('input', () => {
        const group = input.closest('.form-group');
        if (group) group.classList.remove('form-group--error');
      });
    });
  });
}

/* ---------- Smooth Scroll for Anchor Links ---------- */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const targetId = anchor.getAttribute('href');
      if (targetId === '#') return;

      const target = document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        const navbarHeight = document.querySelector('.navbar')?.offsetHeight || 72;
        const targetPosition = target.getBoundingClientRect().top + window.scrollY - navbarHeight;

        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
      }
    });
  });
}

/* ---------- Navbar Scroll Effect ---------- */
function initNavbarScroll() {
  const navbar = document.querySelector('.navbar');
  if (!navbar) return;

  let lastScroll = 0;

  window.addEventListener('scroll', () => {
    const currentScroll = window.scrollY;

    if (currentScroll > 10) {
      navbar.style.boxShadow = '0 1px 8px rgba(0, 0, 0, 0.06)';
    } else {
      navbar.style.boxShadow = 'none';
    }

    lastScroll = currentScroll;
  }, { passive: true });
}
