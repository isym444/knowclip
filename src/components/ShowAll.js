import React from 'react'
import { connect } from 'react-redux'
import {
  Dialog,
  DialogActions,
  DialogContent,
  Table,
  TableBody,
  TableRow,
  TableCell,
  Button,
  Tooltip,
} from '@material-ui/core'
import * as r from '../redux'
import { getFlashcard } from '../selectors'

const getFieldStyles = string => {
  const styles = {}
  if (!string.trim().length) styles.color = 'red'
  return styles
}

const Field = ({ text }) => (
  <span style={getFieldStyles(text)}>{text || 'blank'}</span>
)

let FlashcardRow = ({
  flashcard: { fields, id, tags },
  highlightClip,
  closeModal,
  file,
  useTagsField,
}) => (
  <TableRow hover onClick={() => highlightClip(id)} onDoubleClick={closeModal}>
    {Object.entries(fields).map(([fieldName, fieldText]) => (
      <TableCell key={fieldName}>
        <Field text={fieldText} />
      </TableCell>
    ))}
    <TableCell>{useTagsField && tags.join(', ')}</TableCell>
  </TableRow>
)
FlashcardRow = connect((state, { flashcardId }) => ({
  flashcard: getFlashcard(state, flashcardId),
}))(FlashcardRow)

const ShowAll = ({
  closeDialog,
  flashcards,
  currentFileIndex,
  highlightClip,
  exportCsv,
  exportApkg,
  exportMarkdown,
  noteType,
  open,
}) => (
  <Dialog open={open} onClose={closeDialog}>
    <DialogContent>
      <Table>
        <TableBody>
          {flashcards.map((flashcard, i) => (
            <FlashcardRow
              flashcard={flashcard}
              key={flashcard.id}
              highlightClip={highlightClip}
              closeModal={closeDialog}
              flashcardId={flashcard.id}
              isCurrent={currentFileIndex === i}
              useTagsField={noteType.useTagsField}
            />
          ))}
        </TableBody>
      </Table>
    </DialogContent>
    <DialogActions>
      <Tooltip title="Good for updating existing deck">
        <Button onClick={() => exportCsv()}>Export CSV and MP3</Button>
      </Tooltip>
      <Tooltip title="Create a document for at-a-glance reviews">
        <Button onClick={() => exportMarkdown()}>Export Markdown</Button>
      </Tooltip>
      <Tooltip title="Good for starting new deck">
        <Button
          variant="contained"
          color="primary"
          onClick={() => exportApkg()}
        >
          Export Anki Deck
        </Button>
      </Tooltip>
    </DialogActions>
  </Dialog>
)

const mapStateToProps = state => ({
  flashcards: r.getFlashcardsByTime(state),
  noteType: r.getCurrentNoteType(state),
})

const mapDispatchToProps = {
  exportApkg: r.exportApkg,
  exportCsv: r.exportCsv,
  exportMarkdown: r.exportMarkdown,
  highlightClip: r.highlightClip,
  closeDialog: r.closeDialog,
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ShowAll)
