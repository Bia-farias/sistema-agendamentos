import { Request, Response, NextFunction } from 'express';
import { appointmentService } from '../services/appointmentService.js';
import { sendSuccess } from '../utils/response.js';

export const publicScheduleController = {
  async getSalon(req: Request, res: Response, next: NextFunction) {
    try {
      const { slug } = req.params;
      const salon = await appointmentService.getPublicSalonBySlug(slug);
      return sendSuccess(res, salon);
    } catch (error) {
      return next(error);
    }
  },

  async getBusySlots(req: Request, res: Response, next: NextFunction) {
    try {
      const { slug } = req.params;
      const { date, professionalId } = req.query as { date: string; professionalId?: string };
      const slots = await appointmentService.getPublicBusySlots(slug, date, professionalId);
      return sendSuccess(res, slots);
    } catch (error) {
      return next(error);
    }
  },

  async book(req: Request, res: Response, next: NextFunction) {
    try {
      const { slug } = req.params;
      const result = await appointmentService.bookPublicAppointment(slug, req.body);
      return sendSuccess(res, result, 201);
    } catch (error) {
      return next(error);
    }
  },
};

