import { dispatch as d3_dispatch } from 'd3-dispatch';

import { uiIcon } from './icon';

import { uiOsmoseDetails } from './osmose_details';
import { uiOsmoseHeader } from './osmose_header';
import { uiViewOnOsmose } from './view_on_osmose';
import { utilRebind } from '../util';


export function uiOsmoseEditor(context) {
  const l10n = context.systems.l10n;
  const osmose = context.services.osmose;
  const dispatch = d3_dispatch('change');
  const qaDetails = uiOsmoseDetails(context);
  const qaHeader = uiOsmoseHeader(context);
  let _qaItem;


  function osmoseEditor(selection) {
    const header = selection.selectAll('.header')
      .data([0]);

    const headerEnter = header.enter()
      .append('div')
      .attr('class', 'header fillL');

    headerEnter
      .append('button')
      .attr('class', 'close')
      .on('click', () => context.enter('browse'))
      .call(uiIcon('#rapid-icon-close'));

    headerEnter
      .append('h3')
      .html(l10n.tHtml('QA.osmose.title'));

    let body = selection.selectAll('.body')
      .data([0]);

    body = body.enter()
      .append('div')
      .attr('class', 'body')
      .merge(body);

    let editor = body.selectAll('.qa-editor')
      .data([0]);

    editor.enter()
      .append('div')
      .attr('class', 'modal-section qa-editor')
      .merge(editor)
      .call(qaHeader.issue(_qaItem))
      .call(qaDetails.issue(_qaItem))
      .call(osmoseSaveSection);

    const footer = selection.selectAll('.footer')
      .data([0]);

    footer.enter()
      .append('div')
      .attr('class', 'footer')
      .merge(footer)
      .call(uiViewOnOsmose(context).what(_qaItem));
  }

  function osmoseSaveSection(selection) {
    const errID = _qaItem?.id;
    const isSelected = errID && context.selectedData().has(errID);
    const isShown = (_qaItem && isSelected);
    let saveSection = selection.selectAll('.qa-save')
      .data((isShown ? [_qaItem] : []), d => `${d.id}-${d.status || 0}` );

    // exit
    saveSection.exit()
      .remove();

    // enter
    const saveSectionEnter = saveSection.enter()
      .append('div')
      .attr('class', 'qa-save save-section cf');

    // update
    saveSection = saveSectionEnter
      .merge(saveSection)
      .call(qaSaveButtons);
  }

  function qaSaveButtons(selection) {
    const errID = _qaItem?.id;
    const isSelected = errID && context.selectedData().has(errID);
    let buttonSection = selection.selectAll('.buttons')
      .data((isSelected ? [_qaItem] : []), d => d.status + d.id);

    // exit
    buttonSection.exit()
      .remove();

    // enter
    const buttonEnter = buttonSection.enter()
      .append('div')
      .attr('class', 'buttons');

    buttonEnter
      .append('button')
      .attr('class', 'button close-button action');

    buttonEnter
      .append('button')
      .attr('class', 'button ignore-button action');

    // update
    buttonSection = buttonSection
      .merge(buttonEnter);

    buttonSection.select('.close-button')
      .html(l10n.tHtml('QA.keepRight.close'))
      .on('click.close', function(d3_event, d) {
        this.blur();    // avoid keeping focus on the button - iD#4641
        if (osmose) {
          d.newStatus = 'done';
          osmose.postUpdate(d, (err, item) => dispatch.call('change', item));
        }
      });

    buttonSection.select('.ignore-button')
      .html(l10n.tHtml('QA.keepRight.ignore'))
      .on('click.ignore', function(d3_event, d) {
        this.blur();    // avoid keeping focus on the button - iD#4641
        if (osmose) {
          d.newStatus = 'false';
          osmose.postUpdate(d, (err, item) => dispatch.call('change', item));
        }
      });
  }

  osmoseEditor.error = function(val) {
    if (!arguments.length) return _qaItem;
    _qaItem = val;
    return osmoseEditor;
  };

  return utilRebind(osmoseEditor, dispatch, 'on');
}
