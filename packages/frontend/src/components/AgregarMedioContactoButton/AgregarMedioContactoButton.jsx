import React from 'react';
import PropTypes from 'prop-types';
import { Button } from '@mui/material';
import { FiPlus } from 'react-icons/fi';
import { t } from '../../i18n/t';

const AgregarMedioContactoButton = ({ onClick, className }) => (
  <Button type="button" variant="outlined" startIcon={<FiPlus aria-hidden="true" />} onClick={onClick} className={className}>
    {t('medios.agregar')}
  </Button>
);

AgregarMedioContactoButton.propTypes = {
  onClick: PropTypes.func,
  className: PropTypes.string
};

export default AgregarMedioContactoButton;
