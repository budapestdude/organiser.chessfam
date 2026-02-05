import { Request, Response, NextFunction } from 'express';
import * as pairingsService from '../services/pairingsService';
import { sendSuccess } from '../utils/response';

/**
 * Test endpoint: Generate and view TRF file content
 * This endpoint is for debugging the TRF format
 */
export const viewTRFFile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tournamentId } = req.params;
    const roundNumber = parseInt(req.query.round as string) || 1;

    const trfContent = await pairingsService.generateTRFFile(
      parseInt(tournamentId),
      roundNumber
    );

    // Return as plain text for easy viewing
    res.setHeader('Content-Type', 'text/plain');
    res.send(trfContent);
  } catch (error) {
    next(error);
  }
};

/**
 * Test endpoint: View TRF file as JSON with column positions
 * This helps debug column alignment issues
 */
export const viewTRFFileDebug = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tournamentId } = req.params;
    const roundNumber = parseInt(req.query.round as string) || 1;

    const trfContent = await pairingsService.generateTRFFile(
      parseInt(tournamentId),
      roundNumber
    );

    const lines = trfContent.split('\n').filter(line => line.trim());

    const debugInfo = lines.map(line => {
      let parsed: any = { raw: line, length: line.length };

      if (line.startsWith('012')) {
        parsed.type = 'Tournament Header';
        parsed.fields = {
          identifier: line.substring(0, 3),
          space1: line.substring(3, 4),
          tournamentName: line.substring(4, 88),
          date: line.substring(88, 98),
        };
        parsed.positions = {
          'Tournament Name': '4-88 (84 chars)',
          'Date': '89-98 (10 chars)'
        };
      } else if (line.startsWith('XXR')) {
        parsed.type = 'Round Count';
        parsed.fields = {
          identifier: line.substring(0, 3),
          space1: line.substring(3, 4),
          rounds: line.substring(4),
        };
      } else if (line.startsWith('001')) {
        parsed.type = 'Player Data';
        parsed.fields = {
          identifier: line.substring(0, 3),
          space1: line.substring(3, 4),
          pairingNum: line.substring(4, 8),
          spacing1: line.substring(8, 14),
          name: line.substring(14, 47),
          space2: line.substring(47, 48),
          rating: line.substring(48, 52),
          spacing2: line.substring(52, 88),
          score: line.substring(88, 93),
          space3: line.substring(93, 94),
          rank: line.substring(94, 98),
          results: line.substring(98),
        };
        parsed.positions = {
          'Pairing #': '5-8 (4 chars)',
          'Name': '15-47 (33 chars)',
          'Rating': '49-52 (4 chars)',
          'Score': '89-93 (5 chars)',
          'Rank': '95-98 (4 chars)',
          'Results': '99+ (8 chars per round)'
        };
      }

      return parsed;
    });

    sendSuccess(res, {
      trf: trfContent,
      debug: debugInfo
    });
  } catch (error) {
    next(error);
  }
};
