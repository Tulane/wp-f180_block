/**
 * BLOCK: tu-interfolio
 *
 * Registering a basic block with Gutenberg.
 * Simple block, renders and saves the same content without any interactivity.
 */

//  Import CSS.
import './style.scss';
import './editor.scss';
import { config } from './config.js';
import { displayActivity, cleanTextField } from './formats.js';
import { Spinner, SelectControl, TextControl, FormToggle } from '@wordpress/components';


const { __ } = wp.i18n; // Import __() from wp.i18n
const { registerBlockType } = wp.blocks; // Import registerBlockType() from wp.blocks
const { InspectorControls } = wp.blockEditor;
const { PanelBody, PanelRow } = wp.components;
const el = wp.element.createElement; // Import the element creator function (React abstraction layer)

/**
 * Custom Icon
*/
const iconInterfolio = el('svg', { width: 20, height: 20 },
  el('path', { d: "M10,0C4.5,0,0,4.5,0,10s4.5,10,10,10s10-4.5,10-10S15.5,0,10,0z M10,2.8c1.1,0,1.9,0.9,1.9,1.9c0,1.1-0.9,1.9-1.9,1.9c-1.1,0-1.9-0.9-1.9-1.9C8.1,3.7,8.9,2.8,10,2.8z M12.2,16.9c-1.5,0-4-1-4-3.5v-2.5c0-1.5-0.6-2-1.1-2C6.9,9,6.7,9,6.6,9.2C7.2,8.4,8.1,8,9.1,8c1.7,0,3.1,1.1,3.1,3.2L12.2,16.9L12.2,16.9z" } )
);

/**
 * Register: a Gutenberg Block.
 *
 * Registers a new block provided a unique name and an object defining its
 * behavior. Once registered, the block is made editor as an option to any
 * editor interface where blocks are implemented.
 *
 * @link https://wordpress.org/gutenberg/handbook/block-api/
 * @param  {string}   name     Block name.
 * @param  {Object}   settings Block settings.
 * @return {?WPBlock}          The block, if it has been successfully
 *                             registered; otherwise `undefined`.
 */
registerBlockType('cgb/block-f180-interfolio', {
	// Block name. Block names must be string that contains a namespace prefix. Example: my-plugin/my-custom-block.
	title: __( 'Faculty 180 Block' ), // Block title.
	icon: iconInterfolio, // Block icon from Dashicons → https://developer.wordpress.org/resource/dashicons/.
	category: 'widgets', // Block category — Group blocks together based on common traits E.g. common, formatting, layout widgets, embed.
	keywords: [
		__( 'wp-f180 — CGB Block' ),
		__( 'interfolio' ),
    __( 'faculty 180' ),
	],
  attributes: {
    email: {
      type: 'string'
    },
    userid: {
      type: 'string'
    },
    section: {
      type: 'string'
    },
    user: {
      type: 'object'
    },
    sections: {
      type: 'array',
      default: []
    },
    userOptions: {
      type: 'array',
      default: []
    },
    userdata: {
      type: 'array',
      default: []
    },
    sectiondata: {
      type: 'object'
    },
    hidetitle: {
      type: 'boolean',
      default: false
    },
    userError: {
      type: 'boolean',
      default: false
    },
    foundNoUsers: {
      type: 'boolean',
      default: false
    },
    outputContainer: {
      type: 'string',
      default: 'ul',
    },
    allUsers: {
      type: 'array',
      default: [],
    }
  },

	/**
	 * The edit function describes the structure of your block in the context of the editor.
	 * This represents what the editor will render when the block is used.
	 *
	 * The "edit" property must be a valid function.
	 *
	 * @link https://wordpress.org/gutenberg/handbook/block-api/block-edit-save/
	 */
	edit: function(props) {
    let { allUsers, user, userid, email, userOptions, foundNoUsers } = props.attributes;
    let { section, sections } = props.attributes;
    let { userdata, sectiondata } = props.attributes;
    let { hidetitle, outputContainer, userError } = props.attributes;

    let sectionsToSkip = [];
    if (config['sectionsToSkip']) {
      sectionsToSkip = config['sectionsToSkip'];
    }
  
    jQuery.get('/wp-json/wp-f180/v1/users').done(function(data) {
      let numUsers = data.length;
      
      if (numUsers == 0) {
        props.setAttributes({ foundNoUsers: true });
      }
      
      props.setAttributes({ allUsers: data });
      
      let userOpts = [];
      data.forEach(function(item, index) {
        let opt = {value: item.email, label: item.lastname + ', ' + item.firstname};
        userOpts.push(opt);
      });
    
      userOpts.sort(function(a, b) {
        let comparison = 0;
        if (a.label > b.label) {
          comparison = 1;
        } else if (a.label < b.label) {
          comparison = -1;
        }
        return comparison;
      });
      
      userOpts.unshift({value: '', label: "Select a user"});
      props.setAttributes({ userOptions: userOpts });
    });
    
    // Fetch user data based on entered email address
    function updateEmailAddress(newEmail) {
      props.setAttributes({ sections: [] });

      let user = allUsers.filter(obj => {
        return obj.email === newEmail
      });
      
      if (user.length == 1) {
        user = user[0];
        props.setAttributes({ email: newEmail });
        props.setAttributes({ userid: user.userid });
        props.setAttributes({ user: user });

        let target = '/wp-json/wp-f180/v1/userdata/' + user.userid;
        jQuery.get(target).done(function(data) {
          props.setAttributes({ userdata: data });
          let newSections = [];
          data.forEach(function(item, index) {
            let sectionName = item.section.name;
            if (!sectionName.includes('DNU') && !sectionName.includes('TEST') && -1 == sectionsToSkip.indexOf(sectionName)) {
              if (-1 == newSections.indexOf(sectionName)) {
                newSections.push(sectionName);
              }
            }
          });

          newSections.sort();

          let sectionOptions = [];
          sectionOptions.push({value: '', label: 'please select'});
          newSections.forEach(function(item, index) {
            let name = cleanTextField(item);
            let opt = {value: item, label: name};
            sectionOptions.push(opt);
          });
          
          props.setAttributes({ sections: sectionOptions });
        });
      }
      else {
        user = false;
        props.setAttributes({ email: '' });
        props.setAttributes({ userid: '' });
        props.setAttributes({ user: '' });
        props.setAttributes({ userError: true });
      }
    }
    // Update stored section data based on selected section
    function updateSection(newSection) {
      if (newSection) {
        props.setAttributes({ section: newSection });
      
        let sectiondata = userdata.filter(obj => {
          return obj.section.name === newSection;
        });
        sectiondata = sectiondata[0];

        props.setAttributes({ sectiondata: sectiondata });
      }
    }
    // Update type of tags used to output content
    function updateOutputContainer(newOutputContainer) {
      props.setAttributes({ outputContainer: newOutputContainer });
    }
    // Manage Hide Title attribute updates
    function updateHideTitle(event) {
      props.setAttributes({ hidetitle: event.target.checked });
    }
    // Update email address
    function updateEmail(email) {
      props.setAttributes({ user: false });
      props.setAttributes({ email: email });
    }
    
		return (
			<div className={ props.className }>
        {!sectiondata && (
          <div className="inferfolio-preloader">
            <img className="preloader-logo" src="/wp-content/plugins/tu-interfolio/img/tu-interfolio.svg" />
            { (allUsers.length == 0 && !foundNoUsers) && (
              <div className="preloader-loadtext">Connecting to Faculty 180 .. <Spinner /></div>
            )}
            { (allUsers.length == 0 && foundNoUsers) && (
              <div className="preloader-loadtext">No site administrators have data on Faculty 180.</div>
            )}
            {allUsers.length > 0 && (
              <SelectControl
                label="Select User:" 
                value={email} 
                onChange={updateEmailAddress}
                options={userOptions}
              />
            )}
            {user && (
              <div className="preloader-user_info">
                {sections.length == 0 && (
                  <div className="user_info-loader">
                    <span>Loading user section data .. <Spinner /></span>
                  </div>
                )}
                {sections.length > 0 && (
                  <SelectControl
                    label="Section to Display:" 
                    value={section} 
                    onChange={updateSection}
                    options={sections}
                    className="user_info-section_select"
                  />
                )}
              </div>
            )}
          </div>
        )}
        {sectiondata && (
          <div className="inferfolio-section_data">
            {!hidetitle && (
              <h3 className="section_data-title">{cleanTextField(section)}</h3>
            )}
            
            { displayActivity(section, sectiondata.activities) }
              
            <InspectorControls>
              <PanelBody>
                {user && (
                  <PanelRow>
                    <div>User: {user.firstname} {user.lastname}</div>
                  </PanelRow>
                )}
              
                {user && (
                  <PanelRow>
                    {sections.length == 0 && (
                      <div>
                        <span>Loading user section data ..</span>
                        <Spinner />
                      </div>
                    )}
                    {sections.length > 0 && (
                      <div>                          
                        <SelectControl
                          label="Section to Display:" 
                          value={section} 
                          onChange={updateSection}
                          options={sections}
                        />
                      </div>
                    )}
                  </PanelRow>
                )}
                <PanelRow>
                  <label htmlFor="hide-title">Hide Section Title</label>
                  <FormToggle checked={hidetitle} onChange={updateHideTitle} />
                </PanelRow>
              </PanelBody>
            </InspectorControls>
          </div>
        )}
			</div>
		);
	},

	/**
	 * The save function defines the way in which the different attributes should be combined
	 * into the final markup, which is then serialized by Gutenberg into post_content.
	 *
	 * The "save" property must be specified and must be a valid function.
	 *
	 * @link https://wordpress.org/gutenberg/handbook/block-api/block-edit-save/
	 */
	save: function(props) {
    let { section, sectiondata, hideTitle } = props.attributes;
    let title = cleanTextField(section)
    
		return (
			<div className={ props.className }>
        {sectiondata && (
          <div className="interfolio-section_data">
            {!hidetitle && (
              <h3 className="section_data-title">{title}</h3>
            )}
            { displayActivity(section, sectiondata.activities) }
          </div>
        )}
			</div>
		);
	},
});
