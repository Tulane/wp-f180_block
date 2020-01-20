function displayActivity(title, activities) {
  title = cleanTextField(title);
  title = title.replace(/[^a-zA-Z]/g, '');
  
  // Default
  let formatFunction = displayActivityDetail;
  
  // If we have a fucntion defined in the formatFunctions object
  // below, use that instead
  if (formatFunctions[title]) {
    formatFunction = formatFunctions[title]
  }

  return (
    <ul>
      {activities.map(activity => formatFunction(activity) )}
    </ul>
  )
}

const formatFunctions = {
  Consulting: (activity) => { 
    let client = cleanTextField(activity.fields['Client/Organization Name']);
    let start = cleanTextField(activity.fields['Start Term']);
    let end = cleanTextField(activity.fields['End Term']);
    let description = cleanTextField(activity.fields['Brief Description']);
  
    let dateRange = start;
    if (end && 'null' != end) {
      dateRange = `${start} - ${end}`;
    }
  
    let output = `${client} (${dateRange}): ${description}`;
  
    return (
      <li key={activity.activityid}>
        {output}
      </li>
    )
  },
}

// Show the full contents of a section item (activity)
function displayActivityDetail(activity) {
  let fields = activity.fields;
  let activityItems = [];

  for (const key in fields) {
    let value = fields[key];

    if (fields.hasOwnProperty(key)) {
      if (value) {
        activityItems.push(`${key}: ${value}`);
      } 
    }
  }

  return (
    <li key={activity.activityid}>
      {activityItems.map(line => displayActivityLine(line) )}
    </li>
  )
}

// Show single line item of a section item (activity)
// Yes, I'm a monster but we control the input here
function displayActivityLine(line) {
  return (
  <div
    dangerouslySetInnerHTML={{
      __html: line
    }}></div>
  )
}

// Too many text fields have escaped html for my taste
function cleanTextField(field) {
  if (field && 'string' == typeof field) {
    field = field.replace(/&quot;/gi, '"');
    field = field.replace(/&amp;/gi, "&");
    field = field.replace(/&lt;/gi, "<");
    field = field.replace(/&gt;/gi, ">");
    field = field.trim();
  }

  return field;
}


export { displayActivity, cleanTextField };
