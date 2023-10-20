import GameLogo from "../src/assets/game-logo.svg";

const Logo = () => {
  return (
    <div className="logo-container">
      <div className="logo">
        <span className="logo-container__first-character">C</span>
        <img
          src={GameLogo}
          alt="Game logo image of disks stacked ontop of eachother"
        ></img>
        <span className="logo-container__suffix">nnect</span>
        <span className="logo-container__number">4</span>
      </div>
    </div>
  );
};

export default Logo;
