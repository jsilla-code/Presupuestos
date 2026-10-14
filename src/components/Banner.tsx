import React from 'react';

interface BannerProps {
  hasExamples: boolean;
  saveErr: boolean;
  onClearExamples: () => void;
}

export const Banner: React.FC<BannerProps> = ({
  hasExamples,
  saveErr,
  onClearExamples,
}) => {
  return (
    <>
      {hasExamples && (
        <div className="banner">
          <span>Estás viendo datos de ejemplo para que pruebes la aplicación.</span>
          <button
            type="button"
            className="btn sm"
            onClick={onClearExamples}
          >
            Borrar ejemplos
          </button>
        </div>
      )}

      {saveErr && (
        <div className="banner">
          <span>Este navegador no permite guardar datos. Lo que hagas se perderá al cerrar la página.</span>
        </div>
      )}
    </>
  );
};
