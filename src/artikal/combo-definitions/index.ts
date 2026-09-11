import { Form } from '../../common/forms'
import * as Api from '../api'

// -------------------------------------------------------------------------------------
// Combo дефиниције модула
// -------------------------------------------------------------------------------------
//
// Исто место као у затеченим пројектима: combo се једном опише, па га свака форма модула
// узима готовог. Тиме иста ознака и исти извор важе и у креирању и у ажурирању и у
// филтеру — без три места на којима може да се разиђе.

export const JedinicaMereCombo = Form.combo({
  label: 'Јединица мере',
  source: Api.pretraziJedinicaMereCombo,
})

export const GrupaArtiklaCombo = Form.combo({
  label: 'Група артикла',
  source: Api.pretraziGrupaArtiklaCombo,
})
