import Event from "../models/event.js";

// Add a new event
export const addEvent = async (req, res) => {
  try {
    console.log('Incoming request body:', req.body);

    const {
      eventFor,
      eventTitle,
      eventCategory,
      startDate,
      endDate,
      startTime,
      endTime,
      attachment,
      message
    } = req.body;

    // Validate required fields
    if (!eventFor || !eventTitle || !eventCategory || !startDate || !endDate || !startTime || !endTime || !message) {
      return res.status(400).json({
        success: false,
        message: 'All required fields must be provided',
      });
    }

    // Parse dates into valid Date objects
    const parsedStartDate = startDate ? new Date(startDate) : null;
    const parsedEndDate = endDate ? new Date(endDate) : null;

    if (isNaN(parsedStartDate?.getTime()) || isNaN(parsedEndDate?.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format',
      });
    }

    const newEvent = new Event({
      eventFor,
      eventTitle,
      eventCategory,
      startDate: parsedStartDate,
      endDate: parsedEndDate,
      startTime,
      endTime,
      message,
      attachment: attachment || undefined, // Ensure attachment is undefined if not provided
    });

    await newEvent.save();

    res.status(201).json({
      success: true,
      message: 'Event created successfully!',
      data: newEvent,
    });
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create event',
      error: error.message,
    });
  }
};

// Other controllers remain unchanged
export const getAllEvents = async (req, res) => {
  try {
    const events = await Event.find().sort({ startDate: 1 }); // Sort by start date ascending
    
    res.status(200).json({
      message: 'Events retrieved successfully',
      count: events.length,
      events: events,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error fetching events',
      error: error.message,
    });
  }
};

export const getEventById = async (req, res) => {
  try {
    const eventId = req.params.id;
    
    const event = await Event.findById(eventId);
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    res.status(200).json({
      message: 'Event retrieved successfully',
      event: event,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error fetching event',
      error: error.message,
    });
  }
};

export const getEventsByCategory = async (req, res) => {
  try {
    const category = req.params.category;
    
    const events = await Event.find({ eventCategory: category }).sort({ startDate: 1 });
    
    res.status(200).json({
      message: 'Events retrieved successfully',
      count: events.length,
      events: events,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error fetching events by category',
      error: error.message,
    });
  }
};

export const updateEvent = async (req, res) => {
  try {
    const eventId = req.params.id;
    const {
      eventFor,
      eventTitle,
      eventCategory,
      startDate,
      endDate,
      startTime,
      endTime,
      attachment,
      message,
    } = req.body;

    // Validate required fields
    if (!eventFor || !eventTitle || !eventCategory || !startDate || !endDate || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: 'All required fields must be provided',
      });
    }

    // Parse dates into valid Date objects
    const parsedStartDate = startDate ? new Date(startDate) : null;
    const parsedEndDate = endDate ? new Date(endDate) : null;

    if (isNaN(parsedStartDate?.getTime()) || isNaN(parsedEndDate?.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format',
      });
    }

    // Find and update the event
    const updatedEvent = await Event.findByIdAndUpdate(
      eventId,
      {
        eventFor,
        eventTitle,
        eventCategory,
        startDate: parsedStartDate,
        endDate: parsedEndDate,
        startTime,
        endTime,
        attachment: attachment || undefined,
        message: message || undefined,
      },
      { new: true, runValidators: true } // Return the updated document and run schema validators
    );

    if (!updatedEvent) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Event updated successfully!',
      data: updatedEvent,
    });
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update event',
      error: error.message,
    });
  }
};


// Delete an event
export const deleteEvent = async (req, res) => {
  try {
    const eventId = req.params.id;

    // Find and delete the event
    const deletedEvent = await Event.findByIdAndDelete(eventId);

    if (!deletedEvent) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Event deleted successfully!',
    });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete event',
      error: error.message,
    });
  }
};