import { Test, TestingModule } from '@nestjs/testing';
import { HttpModule, HttpService } from '@nestjs/axios';
import { getRepositoryToken } from '@nestjs/typeorm';
import { of } from 'rxjs';
import { NasaPowerService } from './nasa-power.service';
import { NasaPowerMonthlyCache } from './nasa-power-monthly-cache.entity';

describe('NasaPowerService', () => {
  let svc: NasaPowerService;
  let httpGet: jest.Mock;
  let repoFindOne: jest.Mock;
  let repoSave: jest.Mock;
  let repoCreate: jest.Mock;

  const samplePowerResponse = (year: number) => ({
    data: {
      properties: {
        parameter: {
          ALLSKY_SFC_SW_DWN: {
            [`${year}01`]: 5.48,
            [`${year}02`]: 6.68,
            [`${year}03`]: 6.80,
            [`${year}04`]: 5.39,
            [`${year}05`]: 5.16,
            [`${year}06`]: 5.09,
            [`${year}07`]: 4.58,
            [`${year}08`]: 5.10,
            [`${year}09`]: 6.00,
            [`${year}10`]: 6.21,
            [`${year}11`]: 5.49,
            [`${year}12`]: 6.19,
            [`${year}13`]: 5.68, // ANN — must be ignored
          },
        },
      },
    },
  });

  beforeEach(async () => {
    httpGet = jest.fn();
    repoFindOne = jest.fn().mockResolvedValue(null);
    repoSave = jest.fn().mockImplementation((e) => Promise.resolve(e));
    repoCreate = jest.fn().mockImplementation((e) => e);

    const module: TestingModule = await Test.createTestingModule({
      imports: [HttpModule],
      providers: [
        NasaPowerService,
        {
          provide: getRepositoryToken(NasaPowerMonthlyCache),
          useValue: {
            findOne: repoFindOne,
            save: repoSave,
            create: repoCreate,
          },
        },
      ],
    })
      .overrideProvider(HttpService)
      .useValue({ get: httpGet })
      .compile();

    svc = module.get(NasaPowerService);
  });

  it('parses POWER monthly response into a 12-element array', async () => {
    httpGet.mockReturnValue(of(samplePowerResponse(2024)));
    const months = await svc.getMonthlyGhi(-1.29, 36.81, 2024);
    expect(months).toHaveLength(12);
    expect(months[0]).toBeCloseTo(5.48, 2);
    expect(months[11]).toBeCloseTo(6.19, 2);
  });

  it('ignores the YYYY13 ANN field (annual average) returned by POWER', async () => {
    httpGet.mockReturnValue(of(samplePowerResponse(2024)));
    const months = await svc.getMonthlyGhi(-1.29, 36.81, 2024);
    // If we'd accidentally let ANN through, we'd see a 13th value.
    expect(months).toHaveLength(12);
  });

  it('treats POWER sentinel values (-999) as missing (null)', async () => {
    httpGet.mockReturnValue(
      of({
        data: {
          properties: {
            parameter: {
              ALLSKY_SFC_SW_DWN: {
                '202401': -999,
                '202402': 6.5,
                '202403': -999,
              },
            },
          },
        },
      }),
    );
    const months = await svc.getMonthlyGhi(0, 0, 2024);
    expect(months[0]).toBeNull();
    expect(months[1]).toBeCloseTo(6.5, 2);
    expect(months[2]).toBeNull();
    // Missing months (Apr-Dec) also null
    expect(months[11]).toBeNull();
  });

  it('memoizes within a single process and deduplicates concurrent fetches', async () => {
    httpGet.mockReturnValue(of(samplePowerResponse(2024)));
    // Two parallel calls for the same cell + year should hit POWER once.
    const [a, b] = await Promise.all([
      svc.getMonthlyGhi(-1.29, 36.81, 2024),
      svc.getMonthlyGhi(-1.29, 36.81, 2024),
    ]);
    expect(a).toEqual(b);
    expect(httpGet).toHaveBeenCalledTimes(1);

    // Third call (after both resolved) — served from in-memory cache,
    // still one HTTP call total.
    await svc.getMonthlyGhi(-1.29, 36.81, 2024);
    expect(httpGet).toHaveBeenCalledTimes(1);
  });

  it('quantizes lat/lon to one decimal place when keying the DB cache', async () => {
    httpGet.mockReturnValue(of(samplePowerResponse(2024)));
    // -1.286 and -1.294 both round to -12.86 → -13 → key the same row.
    await svc.getMonthlyGhi(-1.286, 36.811, 2024);
    expect(repoSave).toHaveBeenCalledTimes(1);
    const saved = repoSave.mock.calls[0][0];
    expect(saved.latQ).toBe(Math.round(-1.286 * 10)); // -13
    expect(saved.lonQ).toBe(Math.round(36.811 * 10)); // 368
  });

  it('serves from the persistent cache when present and not stale', async () => {
    const cached: (number | null)[] = [
      5.5, 6.7, 6.8, 5.4, 5.2, 5.1, 4.6, 5.1, 6.0, 6.2, 5.5, 6.2,
    ];
    repoFindOne.mockResolvedValueOnce({
      latQ: -13,
      lonQ: 368,
      year: 2023, // past year — never stale
      ghiKwhM2Day: cached,
      fetchedAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
    });
    const months = await svc.getMonthlyGhi(-1.29, 36.81, 2023);
    expect(months).toEqual(cached);
    expect(httpGet).not.toHaveBeenCalled();
  });

  it('rejects out-of-range month numbers', async () => {
    await expect(svc.getGhiForMonth(0, 0, 2024, 0)).rejects.toThrow();
    await expect(svc.getGhiForMonth(0, 0, 2024, 13)).rejects.toThrow();
  });
});
