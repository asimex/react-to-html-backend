import React, { useEffect, useRef } from 'react';
import grapesjs from 'grapesjs';
import 'grapesjs/dist/css/grapes.min.css';

// Plugins
import BasicBlocks from 'grapesjs-blocks-basic';
import PluginForms from 'grapesjs-plugin-forms';
import ExportPlugin from 'grapesjs-plugin-export';
import NavbarPlugin from 'grapesjs-navbar';
import CustomCodePlugin from 'grapesjs-custom-code';
import StyleBgPlugin from 'grapesjs-style-bg';
import GrapesPresetWebpage from 'grapesjs-preset-webpage'; // ✅ Import the plugin
import  'grapesjs-project-manager';

const Editor = ({ file, onBack }) => {
  const editorRef = useRef(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!file || !editorRef.current || initializedRef.current) return;
    initializedRef.current = true;

    fetch(`/html-pages/${file}`)
      .then((res) => res.text())
      .then((html) => {
        const editor = grapesjs.init({
          container: editorRef.current,
          fromElement: true,
          pageManager: true,
          height: '100vh',
          width: 'auto',
          storageManager: {
            id: `gjs-${file}-`,
            type: 'local',
            autosave: true,
            autoload: true,
            stepsBeforeSave: 1,
          },
          plugins: [
            BasicBlocks,
            PluginForms,
            ExportPlugin,
            NavbarPlugin,
            CustomCodePlugin,
            StyleBgPlugin,
            GrapesPresetWebpage, // ✅ Add plugin
            'grapesjs-project-manager'
 
           
          ],
         
         
        });
        const pn = editor.Panels;
pn.addButton('options', {
    id: 'open-templates',
    className: 'fa fa-folder-o',
    attributes: {
        title: 'Open projects and templates'
    },
    command: 'open-templates', //Open modal 
});
pn.addButton('views', {
    id: 'open-pages',
    className: 'fa fa-file-o',
    attributes: {
        title: 'Take Screenshot'
    },
    command: 'open-pages',
    togglable: false
});

        // Load the HTML content into the first page
        const pages = editor.Pages.getAll();
        if (pages.length > 0) {
          const firstPage = pages[0];
          editor.Pages.select(firstPage.get('id'));
          editor.setComponents(html);
        }

        // Undo/Redo
        editor.Panels.addButton('options', {
          id: 'undo',
          className: 'fa fa-undo',
          command: 'core:undo',
          attributes: { title: 'Undo' },
        });
        editor.Panels.addButton('options', {
          id: 'redo',
          className: 'fa fa-repeat',
          command: 'core:redo',
          attributes: { title: 'Redo' },
        });

        // Extra Style Property
        editor.StyleManager.addProperty('extra', {
          name: 'Backdrop Filter',
          property: 'backdrop-filter',
          type: 'select',
          defaults: 'none',
          list: [
            { value: 'none' },
            { value: 'blur(5px)' },
            { value: 'brightness(0.8)' },
            { value: 'contrast(150%)' },
          ],
        });
      });
  }, [file]);

  return (
    <div>
      <button
        onClick={onBack}
        style={{
          margin: '10px',
          padding: '8px 12px',
          background: '#f0f0f0',
          border: '1px solid #ccc',
          borderRadius: '4px',
          cursor: 'pointer',
        }}
      >
        ← Back to Templates
      </button>
      <div ref={editorRef}></div>
    </div>
  );
};

export default Editor;
