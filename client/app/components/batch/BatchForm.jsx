import React, { useState, useEffect } from 'react';
import { FormGroup } from './common/FormGroup';
import Input from './common/Input';
import Select from './common/Select';
import { DatePicker } from './common/DatePicker';
import Button from './common/Button';
import { useIngredients } from '../../../hooks/useIngredients';

const defaultForm = {
  ingredient_id: '',
  quantity: '',
  expiry_date: '',
};

const BatchForm = ({ initialData, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState(defaultForm);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    data: ingredients,
    loading: ingredientsLoading,
    fetch: fetchIngredients,
  } = useIngredients(20);

  useEffect(() => {
    fetchIngredients(1);
  }, [fetchIngredients]);

  useEffect(() => {
    if (initialData && initialData.id) {
      setFormData({
        ingredient_id: String(initialData.ingredient_id) || '',
        quantity: initialData.quantity != null ? String(initialData.quantity) : '',
        expiry_date: initialData.expiry_date || '',
      });
    } else {
      setFormData(defaultForm);
    }
  }, [initialData]);

  const handleChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const validationErrors = {};

    if (!formData.ingredient_id) {
      validationErrors.ingredient_id = 'Ingredient is required';
    }

    const quantityNumber = Number(formData.quantity);
    if (!formData.quantity || isNaN(quantityNumber) || quantityNumber <= 0) {
      validationErrors.quantity = 'Quantity must be a positive number';
    }

    if (!formData.expiry_date) {
      validationErrors.expiry_date = 'Expiry date is required';
    } else if (new Date(formData.expiry_date) < new Date()) {
      validationErrors.expiry_date = 'Expiry date must be in the future';
    }

    setErrors(validationErrors);
    return Object.keys(validationErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        ingredient_id: Number(formData.ingredient_id),
        quantity: Number(formData.quantity),
        expiry_date: formData.expiry_date,
      });
    } catch (err) {
      console.error('Form submission error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <form onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
        <FormGroup label="Ingredient" required error={errors.ingredient_id}>
          <Select
            name="ingredient_id"
            value={formData.ingredient_id}
            onChange={(e) => handleChange('ingredient_id', e.target.value)}
            options={ingredients.map((ingredient) => ({
              value: ingredient._id,
              label: `${ingredient.name} ${ingredient.unit ? `(${ingredient.unit})` : ''}`,
            }))}
            placeholder={ingredientsLoading ? 'Loading ingredients...' : 'Select ingredient'}
            disabled={ingredientsLoading}
          />
        </FormGroup>

        <FormGroup label="Quantity" required error={errors.quantity}>
          <Input
            type="number"
            name="quantity"
            value={formData.quantity}
            onChange={(e) => handleChange('quantity', e.target.value)}
            placeholder="Enter batch quantity"
            min="0"
            step="0.01"
            error={!!errors.quantity}
          />
        </FormGroup>

        <FormGroup label="Expiry Date" required error={errors.expiry_date}>
          <DatePicker
            name="expiry_date"
            value={formData.expiry_date}
            onChange={(e) => handleChange('expiry_date', e.target.value)}
            hasError={!!errors.expiry_date}
          />
        </FormGroup>

        <div className="sm:col-span-2">
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
            Ingredient batches are used for expiry tracking and inventory accuracy. Create batches with quantity and expiry to reduce waste.
          </div>
        </div>
      </div>

      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-5 border-t border-gray-200">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" variant="success" loading={isSubmitting} disabled={isSubmitting}>
          {initialData ? 'Update Batch' : 'Create Batch'}
        </Button>
      </div>
    </form>
  );
};

export default BatchForm;
