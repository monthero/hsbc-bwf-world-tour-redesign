let landed = false;

export const isLanding = () => !landed;

export const markLanded = () => {
  landed = true;
};
