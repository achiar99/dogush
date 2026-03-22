import { Link } from 'react-router-dom';
import heConfig from '../../../shared/he.json';

const { logo, title, subtitle, logoImageFile } = heConfig as {
  logo: string;
  title: string;
  subtitle: string;
  logoImageFile?: string;
};

export default function Header() {
  return (
    <header className="hero">
      <div className="hero__logoRow">
        <Link to="/">
          {logoImageFile ? (
            <img
              className="hero__logoImg"
              src={`/images/${logoImageFile}`}
              alt={logo}
            />
          ) : (
            <div className="hero__logo">{logo}</div>
          )}
        </Link>
      </div>
      <h1 className="hero__title">{title}</h1>
      <p className="hero__subtitle">{subtitle}</p>
    </header>
  );
}
