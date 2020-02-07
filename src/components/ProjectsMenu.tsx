import React, { Fragment, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Redirect } from 'react-router-dom'
import {
  Paper,
  MenuList,
  MenuItem,
  Button,
  ListItemText,
  IconButton,
  Menu,
  RootRef,
  Tooltip,
} from '@material-ui/core'
import MoreVertIcon from '@material-ui/icons/MoreVert'
import { basename, join, dirname } from 'path'
import electron from 'electron'
import * as r from '../redux'
import * as actions from '../actions'
import css from './ProjectsMenu.module.css'
import mainCss from './Main.module.css'
import { showOpenDialog } from '../utils/electron'
import usePopover from '../utils/usePopover'
import icon from '../icon.png'

enum $ {
  recentProjectsListItem = 'recent-projects-list-item',
  newProjectButton = 'new-project-button',
  openExistingProjectButton = 'open-existing-project-button',
}

const ProjectMenuItem = ({
  project: availability,
}: {
  project: FileAvailability
}) => {
  const { anchorEl, anchorCallbackRef, open, close, isOpen } = usePopover()

  const dispatch = useDispatch()
  const removeFromRecents = useCallback(
    () => dispatch(actions.deleteFileRequest('ProjectFile', availability.id)),
    [dispatch, availability.id]
  )
  const openProjectById = useCallback(
    () => dispatch(actions.openProjectById(availability.id)),
    [dispatch, availability.id]
  )
  return (
    <Fragment>
      {isOpen && (
        <Menu
          open={isOpen}
          onClose={close}
          anchorEl={anchorEl}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <MenuItem onClick={removeFromRecents}>Remove from recents</MenuItem>
        </Menu>
      )}
      <MenuItem onClick={openProjectById} className={$.recentProjectsListItem}>
        <RootRef rootRef={anchorCallbackRef}>
          <ListItemText
            primary={availability.name}
            secondary={
              availability && (
                <Tooltip title={availability.filePath}>
                  <span>
                    {availability.filePath
                      ? join(
                          basename(dirname(availability.filePath)),
                          basename(availability.filePath)
                        )
                      : 'File not found'}
                  </span>
                </Tooltip>
              )
            }
          />
        </RootRef>
        <IconButton onClick={open}>
          <MoreVertIcon />
        </IconButton>
      </MenuItem>
    </Fragment>
  )
}

const ProjectsMenu = () => {
  const { projects, currentProjectId } = useSelector((state: AppState) => ({
    projects: r.getProjects(state),
    currentProjectId: r.getCurrentProjectId(state),
  }))
  const dispatch = useDispatch()
  const handleClickNewProject = useCallback(
    () => {
      dispatch(actions.newProjectFormDialog())
    },
    [dispatch]
  )
  const onClickOpenExisting = useCallback(
    async () => {
      const filePaths = await showOpenDialog([
        {
          name: 'Knowclip project file',
          extensions: ['kyml'],
        },
      ])

      if (filePaths) {
        dispatch(actions.openProjectByFilePath(filePaths[0]))
      }
    },
    [dispatch]
  )

  if (currentProjectId) return <Redirect to="/" />

  return (
    <section className={mainCss.container}>
      <header className={css.header}>
        <h1 className={css.mainHeading}>
          <img className={css.icon} src={icon} alt="Knowclip icon" /> Knowclip
          <small className={css.versionNumber}>
            {' '}
            {electron.remote.app.getVersion().split('-')[0]}
          </small>
        </h1>
      </header>
      <section className={css.main}>
        <section className={css.menu}>
          <Paper className={css.recentProjectsPaper}>
            <MenuList>
              {projects.length ? null : (
                <MenuItem disabled>No recent projects.</MenuItem>
              )}
              {projects.map(project => (
                <ProjectMenuItem key={project.id} project={project} />
              ))}
            </MenuList>
          </Paper>

          <section className={css.buttons}>
            <Button
              id={$.newProjectButton}
              className={css.button}
              variant="contained"
              color="primary"
              onClick={handleClickNewProject}
            >
              New project
            </Button>
            <Button
              id={$.openExistingProjectButton}
              className={css.button}
              variant="contained"
              color="primary"
              onClick={onClickOpenExisting}
            >
              Open existing project
            </Button>
          </section>
        </section>
      </section>
    </section>
  )
}

export default ProjectsMenu

export { $ as projectsMenu$ }