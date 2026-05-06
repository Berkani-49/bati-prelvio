import { useState } from 'react'
import { Check } from 'lucide-react'
import StepClient   from './StepClient'
import StepArticles from './StepArticles'
import StepRecap    from './StepRecap'
import StepPreview  from './StepPreview'

const STEPS = [
  { id: 1, label: 'Client'     },
  { id: 2, label: 'Articles'   },
  { id: 3, label: 'Récap'      },
  { id: 4, label: 'Aperçu PDF' },
]

export default function DevisForm({ onSave, saving, initialNumero }) {
  const [step, setStep] = useState(1)
  const [data, setData] = useState({ devisNumero: initialNumero })

  function handleNext(partial) {
    setData(prev => ({ ...prev, ...partial }))
    setStep(s => s + 1)
  }

  function handleBack() {
    setStep(s => s - 1)
  }

  return (
    <div className="space-y-8">
      {/* Stepper */}
      <nav aria-label="Étapes du devis">
        <ol className="flex items-center gap-0">
          {STEPS.map((s, i) => {
            const done    = step > s.id
            const current = step === s.id

            return (
              <li key={s.id} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center">
                  <div className={`
                    flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold
                    transition-colors border-2
                    ${done    ? 'bg-primary-600 border-primary-600 text-white'      : ''}
                    ${current ? 'bg-white border-primary-600 text-primary-600'     : ''}
                    ${!done && !current ? 'bg-white border-gray-300 text-gray-400' : ''}
                  `}>
                    {done ? <Check size={14} /> : s.id}
                  </div>
                  <span className={`mt-1 text-xs font-medium hidden sm:block ${
                    current ? 'text-primary-700' : done ? 'text-primary-500' : 'text-gray-400'
                  }`}>
                    {s.label}
                  </span>
                </div>

                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 mb-4 ${step > s.id ? 'bg-primary-400' : 'bg-gray-200'}`} />
                )}
              </li>
            )
          })}
        </ol>
      </nav>

      {/* Step content */}
      <div className="card p-6">
        {step === 1 && <StepClient   data={data} onNext={handleNext}                   />}
        {step === 2 && <StepArticles data={data} onNext={handleNext} onBack={handleBack} />}
        {step === 3 && <StepRecap    data={data} onNext={handleNext} onBack={handleBack} />}
        {step === 4 && <StepPreview  data={data} onBack={handleBack} onSave={() => onSave(data)} saving={saving} />}
      </div>
    </div>
  )
}
