import React, { Component } from 'react'
import { HashRouter } from 'react-router-dom'
import { Switch, Route } from 'react-router'
import Snackbar from './Snackbar'
import Main from './Main'
import Dialog from './Dialog'
import ProjectsMenu from './ProjectsMenu'
import { MuiThemeProvider, createMuiTheme } from '@material-ui/core/styles'
import themeSpecs from '../themeSpecs'
import { CssBaseline } from '@material-ui/core'
import ErrorMessage from './ErrorMessage'

export const theme = createMuiTheme(themeSpecs)

class App extends Component<
  { sentryDsn: string },
  { hasError: boolean; error: any }
> {
  state = { hasError: false, error: null }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) return <ErrorMessage error={this.state.error} />
    return (
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        <HashRouter>
          <Switch>
            <Route exact path="/" component={Main} />
            <Route exact path="/projects" component={ProjectsMenu} />
          </Switch>
        </HashRouter>
        <Snackbar />
        <Dialog />
      </MuiThemeProvider>
    )
  }
}

export default App
