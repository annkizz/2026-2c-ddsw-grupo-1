import React from 'react';
import PropTypes from 'prop-types';
import { Button } from '@mui/material';
import { FiPlus } from 'react-icons/fi';

const AgregarMedioContactoButton = ({ onClick, className }) => (
  <Button type="button" variant="outlined" startIcon={<FiPlus aria-hidden="true" />} onClick={onClick} className={className}>
    Agregar medio de contacto
  </Button>
);

AgregarMedioContactoButton.propTypes = {
  onClick: PropTypes.func,
  className: PropTypes.string
};

export default AgregarMedioContactoButton;
