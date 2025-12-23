import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center px-4 py-16">
          <div className="max-w-2xl w-full text-center">
            <div className="mb-8">
              <div className="inline-flex items-center justify-center w-32 h-32 bg-red-100 rounded-full mb-6">
                <span className="text-6xl font-bold text-red-600">500</span>
              </div>

              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                Hoppá! Valami hiba történt
              </h1>

              <p className="text-lg text-gray-600 mb-8">
                Sajnáljuk, de egy váratlan hiba történt az alkalmazásban.
                Próbáld újra betölteni az oldalt.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-vintage-red text-white font-semibold rounded-lg hover:bg-vintage-red/90 transition-colors"
              >
                Oldal újratöltése
              </button>

              <a
                href="/"
                className="px-6 py-3 bg-gray-900 text-white font-semibold rounded-lg hover:bg-gray-800 transition-colors"
              >
                Vissza a főoldalra
              </a>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mt-8 p-4 bg-red-50 border border-red-200 rounded-lg text-left">
                <h2 className="text-sm font-semibold text-red-900 mb-2">
                  Hiba részletei (csak development módban):
                </h2>
                <pre className="text-xs text-red-800 overflow-auto">
                  {this.state.error.toString()}
                  {this.state.error.stack}
                </pre>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;