const API = '/api';

function getToken() {
  return localStorage.getItem('token');
}

async function api(path, method='GET', body) {
  const res = await fetch(API + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(getToken() ? { Authorization: 'Bearer ' + getToken() } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export const base44 = {
  auth: {
    async me() {
      return api('/auth/me');
    },
    async login(email, password) {
      const r = await api('/auth/login','POST',{ email, password });
      localStorage.setItem('token', r.token);
      return r;
    },
    async register(email, password) {
      const r = await api('/auth/register','POST',{ email, password });
      localStorage.setItem('token', r.token);
      return r;
    },
    logout() {
      localStorage.removeItem('token');
      window.location.reload();
    },
    redirectToLogin() {}
  },

  entities: {
    Customer: crud('/customers'),
    Product: crud('/products'),
    Invoice: crud('/invoices'),
    CompanyProfile: crud('/company-profile')
  },

  integrations: {
    companyLookup: {
      lookup: (query) => api('/integrations/company-lookup', 'POST', { query }),
      autocomplete: (query) => api('/integrations/company-autocomplete', 'POST', { query })
    },
    Core: {
      SendEmail: (data) => api('/integrations/send-email','POST',data),
      UploadFile: (file) => {
        const fd = new FormData();
        fd.append('file', file);
        return fetch(API+'/integrations/upload',{ method:'POST', body:fd, headers:{ Authorization:'Bearer '+getToken() } }).then(r=>r.json());
      },
      InvokeLLM: async () => ({})
    }
  }
};

function crud(path) {
  return {
    list: () => api(path),
    create: (data) => api(path,'POST',data),
    update: (id,data) => api(path+'/'+id,'PUT',data),
    delete: (id) => api(path+'/'+id,'DELETE')
  };
}
