import { useLocation, Link } from "react-router-dom";

const NotFound = () => {
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center">
      <h1 className="text-3xl font-bold mb-2">404 – Page Not Found</h1>
      <p className="text-muted-foreground mb-4">
        No route matches <code>{location.pathname}</code>
      </p>

      <Link
        to="/"
        className="text-primary underline underline-offset-4"
      >
        Go back home
      </Link>
    </div>
  );
};

export default NotFound;
