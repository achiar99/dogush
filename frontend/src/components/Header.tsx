import { Link } from 'react-router-dom';
import heConfig from '../../../shared/he.json';

const { strings, logoImageFile } = heConfig as {
  strings: {
    logo: string;
    title: string;
    subtitle: string;
  };
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
              alt={strings.logo}
            />
          ) : (
            <div className="hero__logo">{strings.logo}</div>
          )}
        </Link>
      </div>
      <h1 className="hero__title">{strings.title}</h1>
      <p className="hero__subtitle">{strings.subtitle}</p>
    </header>
  );
}
