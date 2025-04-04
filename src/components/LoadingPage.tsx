function LoadingPage() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50">
      <div className="text-center">
        <div className="loader mb-4"></div>
        <p className="text-lg font-medium text-white">Chargemennt en cours...</p>
        <p className="text-lg font-medium text-white">Ne pas fermer cette page.</p>
      </div>
    </div>
  );
}

export default LoadingPage;
