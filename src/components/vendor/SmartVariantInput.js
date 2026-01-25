import React, { useState, useEffect } from "react";
import { HexColorPicker } from "react-colorful";

// Inline styles for color picker (replaces CSS import)
const colorPickerStyles = `
  .react-colorful {
    position: relative;
    display: flex;
    flex-direction: column;
    width: 200px;
    height: 200px;
    user-select: none;
    cursor: default;
  }
  
  .react-colorful__saturation {
    position: relative;
    flex-grow: 1;
    border-color: transparent;
    border-bottom: 12px solid #000;
    border-radius: 8px 8px 0 0;
    background-image: linear-gradient(0deg, #000, transparent), linear-gradient(90deg, #fff, hsla(0, 0%, 100%, 0));
    cursor: crosshair;
  }
  
  .react-colorful__pointer {
    position: absolute;
    z-index: 1;
    box-sizing: border-box;
    width: 28px;
    height: 28px;
    transform: translate(-50%, -50%);
    background-color: #fff;
    border: 2px solid #000;
    border-radius: 50%;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.4);
    cursor: grab;
  }
  
  .react-colorful__pointer:active {
    cursor: grabbing;
  }
  
  .react-colorful__pointer-fill {
    width: 100%;
    height: 100%;
    border-radius: inherit;
  }
  
  .react-colorful__saturation .react-colorful__pointer-fill {
    background-color: currentColor;
    pointer-events: none;
  }
  
  .react-colorful__interactive {
    position: absolute;
    left: 0;
    top: 0;
    right: 0;
    bottom: 0;
    border-radius: inherit;
    outline: none;
    touch-action: none;
    cursor: inherit;
  }
  
  .react-colorful__hue {
    position: relative;
    height: 24px;
    border-radius: 0 0 8px 8px;
    background: linear-gradient(90deg, red 0, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, red);
    cursor: pointer;
  }
  
  .react-colorful__hue .react-colorful__pointer {
    width: 20px;
    height: 100%;
    border-radius: 4px;
    transform: translate(-50%, 0);
    background: transparent;
    border: 3px solid #fff;
    box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.3), 0 2px 4px rgba(0, 0, 0, 0.4);
  }
`;

/**
 * Smart Variant Input Component
 * Provides different input types based on variant input_type:
 * - swatch: Color picker for hex colors
 * - pattern: Image-based selection
 * - dropdown: Standard checkboxes
 * - text: Predefined options + optional custom
 */
const SmartVariantInput = ({ 
  variant, 
  selectedValues = [], 
  onChange,
  variantId 
}) => {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [customColor, setCustomColor] = useState("#000000");
  const [customColorLabel, setCustomColorLabel] = useState("");

  // Ensure color is in proper hex format
  const normalizeHexColor = (color) => {
    if (!color) return "#000000";
    // If color doesn't start with #, add it
    if (!color.startsWith('#')) {
      return `#${color}`;
    }
    // Ensure uppercase for consistency
    return color.toUpperCase();
  };

  // Update color with normalization
  const handleColorChange = (newColor) => {
    setCustomColor(normalizeHexColor(newColor));
  };

  const variantData = typeof variant.variant_id === 'object' 
    ? variant.variant_id 
    : null;

  if (!variantData) {
    return <div className="text-muted">Variant data not available</div>;
  }

  const inputType = variantData.input_type || 'dropdown';
  const variantOptions = variantData.options || [];
  const variantName = variantData.variant_name || 'Variant';

  // Toggle selection for checkbox/standard options
  const toggleOption = (optionLabel, optionValue) => {
    const isCurrentlySelected = selectedValues.includes(optionLabel);
    
    if (isCurrentlySelected) {
      // Remove from selection
      const newValues = selectedValues.filter(v => v !== optionLabel);
      onChange(newValues);
    } else {
      // Add to selection
      const newValues = [...selectedValues, optionLabel];
      onChange(newValues);
      
      // Auto-fill color picker for swatch type and open the picker
      if (inputType === 'swatch' && optionValue) {
        const normalizedColor = normalizeHexColor(optionValue);
        setCustomColor(normalizedColor);
        setCustomColorLabel(optionLabel);
        setShowColorPicker(true); // Open the picker automatically
      }
    }
  };

  // Remove a selected value
  const removeValue = (value) => {
    onChange(selectedValues.filter(v => v !== value));
  };

  // Add custom color
  const addCustomColor = () => {
    if (!customColorLabel.trim()) {
      alert("Please enter a color name");
      return;
    }
    
    const colorEntry = `${customColorLabel.trim()}|${customColor}`;
    if (!selectedValues.includes(colorEntry)) {
      onChange([...selectedValues, colorEntry]);
    }
    
    setCustomColorLabel("");
    setCustomColor("#000000");
    setShowColorPicker(false);
  };

  // Render based on input type
  switch (inputType) {
    case 'swatch': // COLOR PICKER
      return (
        <div className="smart-variant-input">
          <style>{colorPickerStyles}</style>
          <label className="form-label fw-bold">
            {variantName}
            <span className="text-danger ms-1">*</span>
          </label>
          
          {/* Official Color Options */}
          <div className="mb-3">
            <p className="text-muted small mb-2">
              Select from official colors ({variantOptions.filter(o => o.active).length} available):
            </p>
            <div className="d-flex flex-wrap gap-2">
              {variantOptions.filter(opt => opt.active).map((option) => {
                const isSelected = selectedValues.includes(option.label);
                const colorValue = option.value || '#CCCCCC';
                
                return (
                  <div
                    key={option._id}
                    onClick={() => toggleOption(option.label, colorValue)}
                    className={`color-swatch-option ${isSelected ? 'selected' : ''}`}
                    style={{
                      cursor: 'pointer',
                      padding: '8px',
                      border: isSelected ? '3px solid #28a745' : '2px solid #ddd',
                      borderRadius: '8px',
                      textAlign: 'center',
                      minWidth: '80px',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div
                      style={{
                        width: '50px',
                        height: '50px',
                        backgroundColor: colorValue,
                        borderRadius: '6px',
                        margin: '0 auto 5px',
                        border: '1px solid #ccc'
                      }}
                    />
                    <small className="d-block fw-bold">{option.label}</small>
                    {isSelected && (
                      <small className="text-success">✓ Selected</small>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Custom Color Picker */}
          <div className="mb-3">
            <button
              type="button"
              className="btn btn-outline-primary btn-sm"
              onClick={() => setShowColorPicker(!showColorPicker)}
            >
              {showColorPicker ? '− Hide' : '+ Add'} Custom Color
            </button>
            
            {customColorLabel && !showColorPicker && (
              <span className="ms-2 badge bg-light text-dark border">
                Ready to add: {customColorLabel} ({customColor})
              </span>
            )}

            {showColorPicker && (
              <div className="border rounded p-3 mt-2 bg-light">
                {customColorLabel && (
                  <div className="alert alert-info py-2 mb-2 small text-dark">
                    💡 Color "{customColorLabel}" is pre-filled. You can modify it or use as-is.
                  </div>
                )}
                <div className="row">
                  <div className="col-md-6">
                    <label className="form-label small text-dark">Color Name:</label>
                    <input
                      type="text"
                      className="form-control form-control-sm mb-2"
                      placeholder="e.g., Sky Blue"
                      value={customColorLabel}
                      onChange={(e) => setCustomColorLabel(e.target.value)}
                    />
                    
                    <label className="form-label small text-dark">Pick Color:</label>
                    <HexColorPicker 
                      color={customColor} 
                      onChange={handleColorChange}
                      style={{ width: '100%', height: '150px' }}
                    />
                    <input
                      type="text"
                      className="form-control form-control-sm mt-2"
                      value={customColor}
                      onChange={(e) => handleColorChange(e.target.value)}
                      placeholder="#000000"
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small text-dark">Preview:</label>
                    <div
                      style={{
                        width: '100%',
                        height: '150px',
                        backgroundColor: customColor,
                        borderRadius: '8px',
                        border: '2px solid #ddd'
                      }}
                    />
                    <p className="small mt-2 mb-0">
                      <strong>{customColorLabel || 'Custom Color'}</strong>
                      <br />
                      <code>{customColor}</code>
                    </p>
                  </div>
                </div>
                <div className="mt-2 d-flex gap-2">
                  <button
                    type="button"
                    className="btn btn-success btn-sm"
                    onClick={addCustomColor}
                  >
                    Add Color
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      setShowColorPicker(false);
                      setCustomColorLabel("");
                      setCustomColor("#000000");
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Selected Colors Display */}
          {selectedValues.length > 0 && (
            <div className="selected-values-display bg-success bg-opacity-10 border border-success rounded p-2">
              <small className="text-muted d-block mb-2">
                Selected Colors ({selectedValues.length}):
              </small>
              <div className="d-flex flex-wrap gap-2">
                {selectedValues.map((value, idx) => {
                  // Parse custom colors (format: "Label|#HEX")
                  const isCustomColor = value.includes('|');
                  const displayLabel = isCustomColor ? value.split('|')[0] : value;
                  const colorHex = isCustomColor 
                    ? value.split('|')[1] 
                    : variantOptions.find(o => o.label === value)?.value || '#CCCCCC';

                  return (
                    <span
                      key={idx}
                      className="badge bg-white border d-inline-flex align-items-center gap-2 p-2"
                      style={{ fontSize: '0.9rem' }}
                    >
                      <span
                        style={{
                          width: '20px',
                          height: '20px',
                          backgroundColor: colorHex,
                          borderRadius: '4px',
                          border: '1px solid #ccc',
                          display: 'inline-block'
                        }}
                      />
                      <span className="text-dark">{displayLabel}</span>
                      <button
                        type="button"
                        className="btn-close btn-close-sm"
                        style={{ fontSize: '0.6rem' }}
                        onClick={() => removeValue(value)}
                      />
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      );

    case 'pattern': // PATTERN/IMAGE SELECTION
      return (
        <div className="smart-variant-input">
          <label className="form-label fw-bold">
            {variantName}
            <span className="text-danger ms-1">*</span>
          </label>
          
          <div className="d-flex flex-wrap gap-3">
            {variantOptions.filter(opt => opt.active).map((option) => {
              const isSelected = selectedValues.includes(option.label);
              
              return (
                <div
                  key={option._id}
                  onClick={() => toggleOption(option.label)}
                  className={`pattern-option ${isSelected ? 'selected' : ''}`}
                  style={{
                    cursor: 'pointer',
                    padding: '10px',
                    border: isSelected ? '3px solid #28a745' : '2px solid #ddd',
                    borderRadius: '8px',
                    textAlign: 'center',
                    minWidth: '100px',
                    transition: 'all 0.2s'
                  }}
                >
                  {option.image_url ? (
                    <img
                      src={option.image_url}
                      alt={option.label}
                      style={{
                        width: '80px',
                        height: '80px',
                        objectFit: 'cover',
                        borderRadius: '6px',
                        marginBottom: '5px'
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '80px',
                        height: '80px',
                        backgroundColor: '#f0f0f0',
                        borderRadius: '6px',
                        marginBottom: '5px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <span className="text-muted">No Image</span>
                    </div>
                  )}
                  <small className="d-block fw-bold">{option.label}</small>
                  {isSelected && (
                    <small className="text-success">✓ Selected</small>
                  )}
                </div>
              );
            })}
          </div>

          {selectedValues.length > 0 && (
            <div className="mt-3 p-2 bg-success bg-opacity-10 border border-success rounded">
              <small className="text-muted">Selected: {selectedValues.join(', ')}</small>
            </div>
          )}
        </div>
      );

    case 'dropdown': // STANDARD CHECKBOX SELECTION
    case 'text':
    default:
      const [showCustomInput, setShowCustomInput] = useState(false);
      const [customValue, setCustomValue] = useState("");

      const addCustomValue = () => {
        if (!customValue.trim()) {
          alert("Please enter a value");
          return;
        }
        
        if (!selectedValues.includes(customValue.trim())) {
          onChange([...selectedValues, customValue.trim()]);
        }
        
        setCustomValue("");
        setShowCustomInput(false);
      };

      return (
        <div className="smart-variant-input">
          <label className="form-label fw-bold">
            {variantName}
            <span className="text-danger ms-1">*</span>
          </label>
          
          <div className="border rounded p-3" style={{ maxHeight: '250px', overflowY: 'auto' }}>
            {variantOptions.filter(opt => opt.active).map((option) => {
              const isSelected = selectedValues.includes(option.label);
              
              return (
                <div key={option._id} className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id={`${variantId}-${option._id}`}
                    checked={isSelected}
                    onChange={() => toggleOption(option.label)}
                  />
                  <label 
                    className="form-check-label text-dark" 
                    htmlFor={`${variantId}-${option._id}`}
                  >
                    {option.label}
                    {option.value && option.value !== option.label && (
                      <span className="text-muted small ms-2">({option.value})</span>
                    )}
                  </label>
                </div>
              );
            })}
          </div>

          {/* Add Custom Value Button */}
          <div className="mt-2">
            <button
              type="button"
              className="btn btn-outline-primary btn-sm"
              onClick={() => setShowCustomInput(!showCustomInput)}
            >
              {showCustomInput ? '− Hide' : '+ Add'} Custom {variantName}
            </button>

            {showCustomInput && (
              <div className="border rounded p-3 mt-2 bg-light">
                <label className="form-label small text-dark">Enter Custom {variantName}:</label>
                <div className="input-group input-group-sm">
                  <input
                    type="text"
                    className="form-control"
                    placeholder={`e.g., ${variantName === 'Size' ? 'XXL' : 'Custom Value'}`}
                    value={customValue}
                    onChange={(e) => setCustomValue(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addCustomValue()}
                  />
                  <button
                    type="button"
                    className="btn btn-success"
                    onClick={addCustomValue}
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setShowCustomInput(false);
                      setCustomValue("");
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {selectedValues.length > 0 && (
            <div className="mt-2 d-flex flex-wrap gap-2">
              {selectedValues.map((value, idx) => (
                <span
                  key={idx}
                  className="badge bg-light border d-inline-flex align-items-center gap-1 text-dark"
                >
                  {value}
                  <button
                    type="button"
                    className="btn-close btn-close-sm"
                    style={{ fontSize: '0.6rem' }}
                    onClick={() => removeValue(value)}
                  />
                </span>
              ))}
            </div>
          )}
        </div>
      );
  }
};

export default SmartVariantInput;
