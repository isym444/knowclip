import { ignoreElements, tap } from 'rxjs/operators'
// import { fromEvent } from 'rxjs'
import { ofType } from 'redux-observable'
// import { ipcRenderer } from 'electron'
// import { persistState } from '../utils/statePersistence'

export const persistState = (state: AppState) => {
  window.localStorage.setItem('projects', JSON.stringify(state.projects))
}

const persistStateEpic = (action$, state$) =>
  action$.pipe(
    ofType('OPEN_PROJECT'),
    tap(() => {
      persistState(state$.value)
    }),
    ignoreElements()
  )

export default persistStateEpic
