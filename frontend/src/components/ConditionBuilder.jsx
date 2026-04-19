import { Clock, UserCheck, Globe, Plus, Trash2 } from 'lucide-react';

const CONDITION_TYPES = [
  { value: 'time', label: 'Time-Based', icon: Clock, description: 'Release after a specific date/time' },
  { value: 'approval', label: 'Approval-Based', icon: UserCheck, description: 'Requires manual approval from signers' },
  { value: 'oracle', label: 'Oracle Data', icon: Globe, description: 'Based on external data (advanced)' },
];

export default function ConditionBuilder({ conditions, onChange }) {
  const addCondition = () => {
    const newCond = {
      type: 'time',
      logicOperator: 'AND',
      logicGroup: 0,
      params: { releaseAfter: '' },
    };
    onChange([...conditions, newCond]);
  };

  const updateCondition = (index, updates) => {
    const next = conditions.map((c, i) => (i === index ? { ...c, ...updates } : c));
    onChange(next);
  };

  const removeCondition = (index) => {
    onChange(conditions.filter((_, i) => i !== index));
  };

  const handleTypeChange = (index, type) => {
    let params = {};
    switch (type) {
      case 'time':
        params = { releaseAfter: '' };
        break;
      case 'approval':
        params = { requiredApprovals: 1, currentApprovals: 0 };
        break;
      case 'oracle':
        params = { endpoint: '', targetValue: '', currentValue: '' };
        break;
    }
    updateCondition(index, { type, params });
  };

  const handleParamChange = (index, key, value) => {
    const cond = conditions[index];
    updateCondition(index, { params: { ...cond.params, [key]: value } });
  };

  const toggleOperator = (index) => {
    const cond = conditions[index];
    updateCondition(index, {
      logicOperator: cond.logicOperator === 'AND' ? 'OR' : 'AND',
    });
  };

  return (
    <div>
      {conditions.map((cond, idx) => (
        <div key={idx}>
          {/* Logic operator between conditions */}
          {idx > 0 && (
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
              <button
                type="button"
                className={`logic-operator-badge ${cond.logicOperator.toLowerCase()}`}
                onClick={() => toggleOperator(idx)}
                title="Click to toggle AND/OR"
              >
                {cond.logicOperator}
              </button>
            </div>
          )}

          <div className="condition-row">
            <div className="condition-fields">
              {/* Type selector */}
              <div className="form-row">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Condition Type</label>
                  <select
                    className="form-select"
                    value={cond.type}
                    onChange={(e) => handleTypeChange(idx, e.target.value)}
                  >
                    {CONDITION_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    onClick={() => removeCondition(idx)}
                  >
                    <Trash2 size={14} />
                    Remove
                  </button>
                </div>
              </div>

              {/* Type-specific params */}
              {cond.type === 'time' && (
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Release After (Date & Time)</label>
                  <input
                    type="datetime-local"
                    className="form-input"
                    value={cond.params.releaseAfter || ''}
                    onChange={(e) => handleParamChange(idx, 'releaseAfter', e.target.value)}
                  />
                  <span className="form-hint">Funds will be released after this time</span>
                </div>
              )}

              {cond.type === 'approval' && (
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Required Approvals</label>
                  <input
                    type="number"
                    className="form-input"
                    min="1"
                    max="10"
                    value={cond.params.requiredApprovals || 1}
                    onChange={(e) => handleParamChange(idx, 'requiredApprovals', parseInt(e.target.value))}
                  />
                  <span className="form-hint">Number of signer approvals needed</span>
                </div>
              )}

              {cond.type === 'oracle' && (
                <div className="form-row">
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Target Value</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g., 100"
                      value={cond.params.targetValue || ''}
                      onChange={(e) => handleParamChange(idx, 'targetValue', e.target.value)}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Data Endpoint</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="https://api.example.com/price"
                      value={cond.params.endpoint || ''}
                      onChange={(e) => handleParamChange(idx, 'endpoint', e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}

      <button type="button" className="btn btn-secondary" onClick={addCondition} style={{ width: '100%', marginTop: 8 }}>
        <Plus size={16} />
        Add Condition
      </button>
    </div>
  );
}
