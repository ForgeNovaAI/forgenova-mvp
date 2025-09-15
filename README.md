# ForgeNovaAI – MVP  

🚀 **ForgeNovaAI** is a no-code platform prototype that helps manufacturers build custom factory apps in minutes, not months.  
This MVP demonstrates core functionality such as CSV uploads, per-template data storage, chart visualizations, and local persistence.  

## 🌐 Live Demo  
👉 [https://mvp.forgenova.ai](https://mvp.forgenova.ai)  

## ✨ Features  
- Upload CSV files for different templates:  
  - Maintenance Log  
  - Production QC  
  - Inventory Count  
  - Safety Audit  
- Automatic data visualization with charts and insights.  
- Data persists per template using localStorage.  
- Delete and reset functionality with confirmation.  
- Clean UI with ForgeNovaAI branding.  

## 📂 Project Structure  
```
index.html        # Main application file
assets/css/       # Stylesheets
assets/img/       # Images and icons
```

## 🚀 Deployment  
This MVP is deployed using [Vercel](https://vercel.com) and connected to the subdomain:  
`mvp.forgenova.ai`  

## 🛠️ How to Run Locally  
1. Clone the repo:  
   ```bash
   git clone https://github.com/<your-username>/forgenova-mvp.git
   cd forgenova-mvp
   ```  
2. Open `index.html` in your browser.  

## 📌 Notes  
- On browser refresh, the app defaults to the **Maintenance Log** template, but data remains saved.  
- Best used in Chrome or Edge for full compatibility.  
