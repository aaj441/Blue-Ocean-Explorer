# Blue Ocean Explorer

A comprehensive platform for discovering and analyzing untapped market opportunities using Blue Ocean Strategy principles. Built with modern web technologies and AI-powered insights.

## 🚀 Features

### Core Functionality
- **Market Analysis**: Create and analyze markets with detailed segmentation
- **Opportunity Tracking**: Identify, score, and track market opportunities
- **Competitive Intelligence**: Analyze competitors and market positioning
- **Trend Monitoring**: Track market trends and sentiment analysis
- **AI Strategy Assistant**: Get personalized strategic guidance from Xavier, our AI advisor
- **Data Visualization**: Interactive charts and constellation maps
- **Export Capabilities**: Export data in multiple formats (CSV, JSON, Excel, PDF)

### Advanced Features
- **Blue Ocean Strategy Framework**: Apply proven methodologies for market creation
- **Value Innovation Analysis**: Identify factors to eliminate, reduce, raise, and create
- **Opportunity Constellation**: Visualize connections between opportunities
- **Real-time Collaboration**: Team features for shared analysis
- **Performance Monitoring**: Built-in performance tracking and optimization
- **Responsive Design**: Mobile-first, accessible interface

## 🛠️ Technology Stack

### Frontend
- **React 19** - Modern React with concurrent features
- **TypeScript** - Type-safe development
- **TanStack Router** - File-based routing
- **TanStack Query** - Server state management
- **Tailwind CSS** - Utility-first styling
- **Recharts** - Data visualization
- **Zustand** - Client state management
- **React Hook Form** - Form handling
- **Zod** - Schema validation

### Backend
- **tRPC** - End-to-end type safety
- **Prisma** - Database ORM
- **PostgreSQL** - Primary database
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **OpenRouter AI** - AI integration

### Infrastructure
- **Vinxi** - Full-stack framework
- **Vite** - Build tool
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **TypeScript** - Type checking

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- pnpm (recommended) or npm
- PostgreSQL database

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd blue-ocean-explorer
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Environment setup**
   ```bash
   cp .env.example .env
   ```
   
   Configure your environment variables:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/blue_ocean_explorer"
   JWT_SECRET="your-jwt-secret"
   OPENROUTER_API_KEY="your-openrouter-api-key"
   BASE_URL="http://localhost:3000"
   ```

4. **Database setup**
   ```bash
   pnpm db:generate
   pnpm db:push
   ```

5. **Start development server**
   ```bash
   pnpm dev
   ```

   The application will be available at `http://localhost:3000`

## 🏗️ Project Structure

```
blue-ocean-explorer/
├── components/           # Reusable UI components
│   ├── charts/          # Data visualization components
│   ├── AppNav.tsx       # Navigation component
│   ├── ErrorBoundary.tsx # Error handling
│   └── LoadingStates.tsx # Loading components
├── routes/              # Page components
│   ├── auth/           # Authentication pages
│   ├── dashboard/      # Dashboard pages
│   ├── markets/        # Market analysis pages
│   ├── boards/         # Opportunity boards
│   └── strategy/       # AI strategy assistant
├── server/             # Backend code
│   ├── trpc/          # API procedures
│   ├── db.ts          # Database connection
│   └── utils/         # Server utilities
├── stores/            # Client state management
├── utils/             # Shared utilities
└── types/             # TypeScript type definitions
```

## 🔧 Development

### Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm typecheck` - Run TypeScript checks
- `pnpm lint` - Run ESLint
- `pnpm format` - Format code with Prettier
- `pnpm db:generate` - Generate Prisma client
- `pnpm db:push` - Push schema to database
- `pnpm db:studio` - Open Prisma Studio

### Code Style

This project uses:
- **ESLint** for code linting
- **Prettier** for code formatting
- **TypeScript** for type safety
- **Conventional Commits** for commit messages

### Performance

The application includes built-in performance monitoring:
- Core Web Vitals tracking
- Bundle size monitoring
- Component render time measurement
- API call performance tracking

## 📊 API Documentation

### Authentication
- `POST /trpc/login` - User login
- `POST /trpc/register` - User registration
- `POST /trpc/logout` - User logout

### Markets
- `GET /trpc/getMarkets` - Get user markets
- `POST /trpc/createMarket` - Create new market
- `GET /trpc/getMarketDetails` - Get market details
- `PUT /trpc/updateMarket` - Update market
- `DELETE /trpc/deleteMarket` - Delete market

### Opportunities
- `GET /trpc/getOpportunities` - Get opportunities
- `POST /trpc/createOpportunity` - Create opportunity
- `PUT /trpc/updateOpportunity` - Update opportunity
- `DELETE /trpc/deleteOpportunity` - Delete opportunity

### AI Features
- `GET /trpc/strategyChatStream` - AI strategy chat
- `GET /trpc/analyzeOpportunityWithAI` - AI opportunity analysis
- `GET /trpc/generateMarketInsights` - AI market insights

## 🎨 UI Components

### Charts
- **TrendsChart** - Market trend visualization
- **OpportunityConstellationChart** - Interactive opportunity network
- **OpportunityStatusChart** - Status distribution
- **SegmentSizeChart** - Market segment comparison

### Forms
- **LoginForm** - User authentication
- **MarketForm** - Market creation/editing
- **OpportunityForm** - Opportunity management

### Layout
- **AppNav** - Main navigation
- **ErrorBoundary** - Error handling
- **LoadingStates** - Loading indicators

## 🔒 Security

### Authentication
- JWT-based authentication
- Password hashing with bcryptjs
- Session management with automatic timeout
- Account lockout after failed attempts

### Data Protection
- Input validation with Zod schemas
- SQL injection prevention with Prisma
- XSS protection with React
- CSRF protection with tRPC

## 🚀 Deployment

### Production Build
```bash
pnpm build
pnpm start
```

### Environment Variables
Ensure all required environment variables are set:
- `DATABASE_URL`
- `JWT_SECRET`
- `OPENROUTER_API_KEY`
- `BASE_URL`

### Database Migration
```bash
pnpm db:migrate
```

## 📈 Performance Optimization

### Code Splitting
- Lazy loading of components
- Route-based code splitting
- Dynamic imports for heavy libraries

### Caching
- React Query for API caching
- Browser caching for static assets
- Service worker for offline support

### Bundle Optimization
- Tree shaking for unused code
- Minification and compression
- Image optimization

## 🧪 Testing

### Unit Tests
```bash
pnpm test
```

### Integration Tests
```bash
pnpm test:integration
```

### E2E Tests
```bash
pnpm test:e2e
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

### Development Guidelines
- Follow TypeScript best practices
- Write meaningful commit messages
- Add JSDoc comments for complex functions
- Ensure all tests pass
- Update documentation as needed

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Check the documentation
- Contact the development team

## 🔄 Changelog

### v1.0.0
- Initial release
- Core market analysis features
- AI strategy assistant
- Data visualization
- Export capabilities

### v1.1.0
- Enhanced UI components
- Improved performance
- Better error handling
- Additional export formats

## 🎯 Roadmap

### Upcoming Features
- [ ] Real-time collaboration
- [ ] Advanced analytics dashboard
- [ ] Mobile app
- [ ] API integrations
- [ ] Custom reporting
- [ ] Team management
- [ ] Advanced AI features

---

Built with ❤️ by the Blue Ocean Explorer team