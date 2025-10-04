import { createDirectus, rest, readItems, staticToken, readItem } from '@directus/sdk';

const directus = createDirectus(import.meta.env.DIRECTUS_URL)
  .with(rest())
  .with(staticToken(import.meta.env.DIRECTUS_TOKEN));

export async function getEvents() {
  const response = await directus.request(
    readItems('events', {
      fields: ['id', 'title', 'date', 'location', 'description'],
      sort: ['date']
    })
  );
  console.log("Events response:", JSON.stringify(response, null, 2));
  return response;
}

export async function getAgendas() {
  try {
    const response = await directus.request(
      readItems('agendas', {
        fields: [
          'id',
          'meeting_date',
          'category',
          'title',
          'notes',
          {
            'agenda_items': [
              'id',
              { 'agenda_items_id': ['id', 'order', 'topic', 'description'] }
            ]
          }
        ],
        sort: ['-meeting_date']
      })
    );
    
    // Transform the M2M structure - flatten the junction table
    const transformed = response.map((agenda: any) => ({
      ...agenda,
      agenda_items: agenda.agenda_items?.map((junction: any) => junction.agenda_items_id).filter(Boolean) || []
    }));
    
    console.log("Agendas transformed:", JSON.stringify(transformed, null, 2));
    return transformed || [];
  } catch (error) {
    console.error("Error fetching agendas:", error);
    return [];
  }
}

export async function getContacts() {
  try {
    const response = await directus.request(
      readItems('contacts', {
        fields: [
          'id',
          'first_name',
          'last_name',
          'email_address',
          'role',
          { 'organisation_id': ['organisation_name', 'id'] }
        ]
      })
    );
    console.log("Contacts response:", JSON.stringify(response, null, 2));
    return response;
  } catch (error) {
    console.error("Error fetching contacts:", error);
    return [];
  }
}

export async function getMembers() {
  try {
    const response = await directus.request(
      readItems('members', {
        fields: [
          'id',
          'firstname',
          'lastname',
          'email',
          'status',
          { 'committee_role_id': ['committee_role', 'id'] }
        ],
        // Remove status filter to see all members
        sort: ['lastname']
      })
    );
    console.log("Members response:", JSON.stringify(response, null, 2));
    return response || [];
  } catch (error) {
    console.error("Error fetching members:", error);
    throw error;
  }
}

export async function getGlobals() {
  const response = await directus.request(
    readItems('site_globals', {
      fields: ['site_title', 'site_description']
    })
  );
  console.log("Globals response:", JSON.stringify(response, null, 2));
  return response;
}

// Reports functions
export async function getReports() {
  try {
    const response = await directus.request(
      readItems('reports', {
        fields: [
          'id',
          'title',
          'date',
          'content',
          'slug',
          'status',
          { 'author': ['id', 'firstname', 'lastname'] }
        ],
        filter: {
          status: { _eq: 'published' }
        },
        sort: ['-date']
      })
    );
    console.log("Reports response:", JSON.stringify(response, null, 2));
    return response || [];
  } catch (error) {
    console.error("Error fetching reports:", error);
    return [];
  }
}

export async function getReport(slug: string) {
  try {
    const response = await directus.request(
      readItems('reports', {
        fields: [
          'id',
          'title',
          'date',
          'content',
          'slug',
          { 'author': ['id', 'firstname', 'lastname'] }
        ],
        filter: {
          slug: { _eq: slug },
          status: { _eq: 'published' }
        },
        limit: 1
      })
    );
    console.log("Report response:", JSON.stringify(response, null, 2));
    return response[0];
  } catch (error) {
    console.error("Error fetching report:", error);
    return null;
  }
}

// Documentation functions
export async function getDocumentation(category?: string) {
  try {
    const filter: any = {};
    if (category) {
      filter.category = { _eq: category };
    }

    const response = await directus.request(
      readItems('documentation', {
        fields: [
          'id',
          'category',
          'title',
          'content',
          'order',
          'last_updated',
          { 'updated_by': ['firstname', 'lastname'] }
        ],
        filter,
        sort: ['order', 'title']
      })
    );
    console.log("Documentation response:", JSON.stringify(response, null, 2));
    return response || [];
  } catch (error) {
    console.error("Error fetching documentation:", error);
    return [];
  }
}

export async function getDocumentationById(id: string) {
  try {
    const response = await directus.request(
      readItem('documentation', id, {
        fields: [
          'id',
          'category',
          'title',
          'content',
          'last_updated',
          { 'updated_by': ['firstname', 'lastname'] }
        ]
      })
    );
    console.log("Documentation item response:", JSON.stringify(response, null, 2));
    return response;
  } catch (error) {
    console.error("Error fetching documentation item:", error);
    return null;
  }
}

export { directus };