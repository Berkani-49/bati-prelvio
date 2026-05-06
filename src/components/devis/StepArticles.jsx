import { useFieldArray, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Trash2, ChevronLeft, ChevronRight } from 'lucide-react'
import Button from '../ui/Button'

const ligneSchema = z.object({
  designation: z.string().min(1, 'Requis'),
  quantite:    z.coerce.number().positive('> 0'),
  pu_ht:       z.coerce.number().positive('> 0'),
})

const schema = z.object({
  lignes: z.array(ligneSchema).min(1, 'Ajoutez au moins un article'),
})

function LigneRow({ index, register, errors, remove, control }) {
  const quantite = useWatch({ control, name: `lignes.${index}.quantite` }) || 0
  const pu_ht    = useWatch({ control, name: `lignes.${index}.pu_ht`    }) || 0
  const total    = (Number(quantite) * Number(pu_ht)).toFixed(2)

  return (
    <div className="grid grid-cols-12 gap-2 items-start">
      {/* Désignation */}
      <div className="col-span-12 sm:col-span-5">
        <input
          placeholder="Désignation du travail ou matériau"
          className={`w-full h-9 px-3 text-sm bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
            errors?.lignes?.[index]?.designation ? 'border-red-400' : 'border-gray-300'
          }`}
          {...register(`lignes.${index}.designation`)}
        />
        {errors?.lignes?.[index]?.designation && (
          <p className="mt-1 text-xs text-red-600">{errors.lignes[index].designation.message}</p>
        )}
      </div>

      {/* Quantité */}
      <div className="col-span-4 sm:col-span-2">
        <input
          type="number"
          step="0.01"
          min="0"
          placeholder="Qté"
          className={`w-full h-9 px-3 text-sm bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-right ${
            errors?.lignes?.[index]?.quantite ? 'border-red-400' : 'border-gray-300'
          }`}
          {...register(`lignes.${index}.quantite`)}
        />
      </div>

      {/* PU HT */}
      <div className="col-span-4 sm:col-span-2">
        <input
          type="number"
          step="0.01"
          min="0"
          placeholder="PU HT €"
          className={`w-full h-9 px-3 text-sm bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-right ${
            errors?.lignes?.[index]?.pu_ht ? 'border-red-400' : 'border-gray-300'
          }`}
          {...register(`lignes.${index}.pu_ht`)}
        />
      </div>

      {/* Total HT (readonly) */}
      <div className="col-span-3 sm:col-span-2">
        <div className="h-9 px-3 flex items-center justify-end text-sm font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-lg">
          {Number(total).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
        </div>
      </div>

      {/* Delete */}
      <div className="col-span-1 flex justify-center">
        <button
          type="button"
          onClick={() => remove(index)}
          className="h-9 w-9 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  )
}

export default function StepArticles({ data, onNext, onBack }) {
  const { register, control, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      lignes: data?.lignes?.length
        ? data.lignes
        : [{ designation: '', quantite: 1, pu_ht: '' }],
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'lignes' })

  function onSubmit(values) {
    onNext({ lignes: values.lignes })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="section-title">Articles & Prestations</h2>
        <p className="text-sm text-gray-500 mt-1">Ajoutez les lignes de votre devis.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* En-tête colonnes */}
        <div className="hidden sm:grid grid-cols-12 gap-2 px-0">
          <div className="col-span-5 text-xs font-medium text-gray-500 uppercase">Désignation</div>
          <div className="col-span-2 text-xs font-medium text-gray-500 uppercase text-right">Qté</div>
          <div className="col-span-2 text-xs font-medium text-gray-500 uppercase text-right">PU HT</div>
          <div className="col-span-2 text-xs font-medium text-gray-500 uppercase text-right">Total HT</div>
        </div>

        {/* Lignes */}
        <div className="space-y-2">
          {fields.map((field, index) => (
            <LigneRow
              key={field.id}
              index={index}
              register={register}
              errors={errors}
              remove={remove}
              control={control}
            />
          ))}
        </div>

        {errors.lignes?.root && (
          <p className="text-xs text-red-600">{errors.lignes.root.message}</p>
        )}

        {/* Ajouter ligne */}
        <button
          type="button"
          onClick={() => append({ designation: '', quantite: 1, pu_ht: '' })}
          className="flex items-center gap-2 text-sm font-medium text-primary-600 hover:text-primary-700 py-1"
        >
          <Plus size={15} />
          Ajouter un article
        </button>

        {/* Navigation */}
        <div className="flex justify-between pt-2 border-t border-gray-100">
          <Button type="button" variant="secondary" onClick={onBack}>
            <ChevronLeft size={15} /> Retour
          </Button>
          <Button type="submit">
            Suivant <ChevronRight size={15} />
          </Button>
        </div>
      </form>
    </div>
  )
}
