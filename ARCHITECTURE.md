# 🚀 Enterprise Project Structure (Adovee-Digital Style)

This document defines a **scalable, secure, production-grade structure** for the invoice system.

---

# 🧠 CORE PRINCIPLES

- Separation of concerns
- Feature-based modular structure
- Secure by default
- No business logic inside UI
- Reusable services & hooks

---

# 📁 FRONTEND STRUCTURE (React)

src/

  app/
    providers/
    router/
    store/

  features/
    invoices/
      components/
      pages/
      hooks/
      services/
      schemas/

    customers/
    products/
    auth/

  shared/
    components/
    ui/
    hooks/
    utils/
    constants/

  lib/
    api/
    validation/
    security/

---

# 📁 BACKEND STRUCTURE (RECOMMENDED)

backend/

  src/
    modules/
      invoice/
        controller/
        service/
        repository/
        dto/
        schema/

      customer/
      auth/

    core/
      middleware/
      security/
      config/
      database/

    utils/

---

# 🔐 SECURITY LAYER (MANDATORY)

Frontend:
- Zod validation
- Input sanitization
- No direct API usage in components

Backend:
- DTO validation (class-validator / zod)
- Rate limiting
- Auth middleware
- Sanitization
- Logging

---

# 🔄 DATA FLOW

UI → Hook → Service → API → Backend Controller → Service → DB

---

# 🧩 NAMING RULES

- camelCase (JS)
- PascalCase (components)
- kebab-case (folders optional)

---

# ⚠️ ANTI-PATTERNS (REMOVE THESE)

- Logic inside components
- Direct API calls in UI
- Mixed responsibilities

---

# ✅ NEXT STEPS

1. Move invoice logic into feature folder
2. Create service layer
3. Add backend validation
4. Add auth middleware
5. Add logging system

---

This structure is designed to scale like a real SaaS (Adovee-level).