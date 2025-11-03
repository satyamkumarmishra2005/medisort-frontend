# MediSort - Healthcare Management Frontend

A modern, secure healthcare management frontend built with React, TypeScript, Tailwind CSS, and shadcn/ui components.

## 🏥 Features

- **Modern Healthcare Theme**: Light blue, white, and soft green color scheme
- **Authentication System**: Login, Register, and Forgot Password pages
- **Form Validation**: Client-side validation with error handling
- **JWT Authentication**: Mock JWT implementation (ready for backend integration)
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Smooth Animations**: Framer Motion animations throughout the UI
- **Reusable Components**: Button, Input, Card, Modal components
- **Protected Routes**: Authentication-based routing
- **Dashboard**: Sample dashboard with healthcare metrics

## 🚀 Tech Stack

- **React 18** - Modern React with hooks
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Beautiful, accessible UI components
- **Framer Motion** - Smooth animations and transitions
- **React Router** - Client-side routing
- **Lucide React** - Beautiful icons

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd frontend_medisort
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🔐 Demo Credentials

For testing purposes, you can use these demo credentials:

- **Email**: `demo@medisort.com`
- **Password**: `password`

## 📱 Pages & Routes

- **`/`** → Redirects to `/login`
- **`/login`** → User authentication
- **`/register`** → User registration
- **`/forgot-password`** → Password reset
- **`/dashboard`** → Main application dashboard (protected)

## 🎨 Component Library

### UI Components
- **Button**: Multiple variants including healthcare theme
- **Input**: Form inputs with validation states
- **Card**: Content containers with shadows
- **Modal**: Animated modal dialogs

### Theme Colors
- **Primary Blue**: `#3B82F6` (Light blue)
- **Secondary Green**: `#10B981` (Soft green)
- **White**: `#FFFFFF`
- **Gray Variants**: Light and medium grays

## 🔧 Customization

### Adding New Components
1. Create component in `src/components/ui/`
2. Follow shadcn/ui patterns
3. Use the `cn()` utility for class merging
4. Include TypeScript interfaces

### Theme Modifications
- Update colors in `tailwind.config.js`
- Modify CSS variables in `src/index.css`
- Use healthcare theme classes throughout components

## 📱 Responsive Design

The application is built with a mobile-first approach:
- **Mobile**: Optimized for small screens
- **Tablet**: Responsive grid layouts
- **Desktop**: Full-featured interface

## 🚀 Building for Production

```bash
npm run build
```

This creates an optimized production build in the `build/` folder.

## 🧪 Testing

```bash
npm test
```

## 📁 Project Structure

```
src/
├── components/
│   └── ui/           # Reusable UI components
├── contexts/         # React contexts (Auth)
├── lib/             # Utility functions
├── pages/           # Page components
├── App.tsx          # Main app with routing
├── index.tsx        # Entry point
└── index.css        # Global styles
```

## 🔒 Security Features

- **Protected Routes**: Authentication-based access control
- **Form Validation**: Client-side input validation
- **JWT Placeholder**: Ready for backend JWT integration
- **Secure Storage**: Local storage for demo purposes

## 🌟 Future Enhancements

- [ ] Real backend integration
- [ ] User profile management
- [ ] Medical record uploads
- [ ] Care team collaboration
- [ ] Appointment scheduling
- [ ] Medication tracking
- [ ] Health analytics dashboard

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support or questions, please open an issue in the repository.

---

Built with ❤️ for modern healthcare management
