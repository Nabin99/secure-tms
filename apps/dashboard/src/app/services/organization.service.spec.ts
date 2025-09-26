import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { OrganizationService } from './organization.service';
import { OrganizationResponse, OrganizationStats } from '@secure-tms/data';

describe('OrganizationService', () => {
  let service: OrganizationService;
  let httpMock: HttpTestingController;

  const mockParentOrg: OrganizationResponse = {
    id: 'org-1',
    name: 'Parent Organization',
    description: 'Main organization',
    level: 1,
    isActive: true,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01')
  };

  const mockChildOrg: OrganizationResponse = {
    id: 'org-2',
    name: 'Child Organization',
    description: 'Sub organization',
    level: 2,
    parentId: 'org-1',
    isActive: true,
    createdAt: new Date('2023-01-02'),
    updatedAt: new Date('2023-01-02'),
    parent: {
      id: 'org-1',
      name: 'Parent Organization'
    }
  };

  const mockHierarchy: OrganizationResponse[] = [
    {
      ...mockParentOrg,
      children: [mockChildOrg]
    }
  ];

  const mockStats: OrganizationStats = {
    totalUsers: 10,
    activeUsers: 8,
    totalTasks: 25,
    completedTasks: 15,
    totalRoles: 3,
    subOrganizations: 2
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [OrganizationService]
    });
    service = TestBed.inject(OrganizationService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getHierarchy', () => {
    it('should fetch organization hierarchy', () => {
      service.getHierarchy().subscribe(hierarchy => {
        expect(hierarchy).toEqual(mockHierarchy);
        expect(hierarchy[0].children).toHaveLength(1);
        expect(hierarchy[0].children?.[0].level).toBe(2);
      });

      const req = httpMock.expectOne('/api/organizations/hierarchy');
      expect(req.request.method).toBe('GET');
      req.flush(mockHierarchy);
    });

    it('should handle error when fetching hierarchy', () => {
      service.getHierarchy().subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(500);
        }
      });

      const req = httpMock.expectOne('/api/organizations/hierarchy');
      req.flush('Internal Server Error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('getAccessibleOrganizations', () => {
    it('should fetch accessible organizations', () => {
      const expectedOrgs = [mockParentOrg, mockChildOrg];

      service.getAccessibleOrganizations().subscribe(orgs => {
        expect(orgs).toEqual(expectedOrgs);
        expect(orgs).toHaveLength(2);
      });

      const req = httpMock.expectOne('/api/organizations/accessible');
      expect(req.request.method).toBe('GET');
      req.flush(expectedOrgs);
    });
  });

  describe('getOrganization', () => {
    it('should fetch organization by ID', () => {
      service.getOrganization('org-1').subscribe(org => {
        expect(org).toEqual(mockParentOrg);
        expect(org.level).toBe(1);
        expect(org.parentId).toBeUndefined();
      });

      const req = httpMock.expectOne('/api/organizations/org-1');
      expect(req.request.method).toBe('GET');
      req.flush(mockParentOrg);
    });

    it('should fetch child organization by ID', () => {
      service.getOrganization('org-2').subscribe(org => {
        expect(org).toEqual(mockChildOrg);
        expect(org.level).toBe(2);
        expect(org.parentId).toBe('org-1');
        expect(org.parent?.name).toBe('Parent Organization');
      });

      const req = httpMock.expectOne('/api/organizations/org-2');
      expect(req.request.method).toBe('GET');
      req.flush(mockChildOrg);
    });
  });

  describe('getOrganizationStats', () => {
    it('should fetch organization statistics', () => {
      service.getOrganizationStats('org-1').subscribe(stats => {
        expect(stats).toEqual(mockStats);
        expect(stats.totalUsers).toBe(10);
        expect(stats.subOrganizations).toBe(2);
      });

      const req = httpMock.expectOne('/api/organizations/org-1/stats');
      expect(req.request.method).toBe('GET');
      req.flush(mockStats);
    });
  });

  describe('createOrganization', () => {
    it('should create parent organization', () => {
      const createData = {
        name: 'New Parent Org',
        description: 'A new parent organization'
      };

      service.createOrganization(createData).subscribe(org => {
        expect(org.name).toBe(createData.name);
        expect(org.level).toBe(1);
        expect(org.parentId).toBeUndefined();
      });

      const req = httpMock.expectOne('/api/organizations');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(createData);
      req.flush({
        ...mockParentOrg,
        name: createData.name,
        description: createData.description
      });
    });

    it('should create child organization', () => {
      const createData = {
        name: 'New Child Org',
        description: 'A new child organization',
        parentId: 'org-1'
      };

      service.createOrganization(createData).subscribe(org => {
        expect(org.name).toBe(createData.name);
        expect(org.level).toBe(2);
        expect(org.parentId).toBe('org-1');
      });

      const req = httpMock.expectOne('/api/organizations');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(createData);
      req.flush({
        ...mockChildOrg,
        name: createData.name,
        description: createData.description
      });
    });
  });

  describe('updateOrganization', () => {
    it('should update organization', () => {
      const updateData = {
        name: 'Updated Organization Name',
        isActive: false
      };

      service.updateOrganization('org-1', updateData).subscribe(org => {
        expect(org.name).toBe(updateData.name);
        expect(org.isActive).toBe(false);
      });

      const req = httpMock.expectOne('/api/organizations/org-1');
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(updateData);
      req.flush({
        ...mockParentOrg,
        ...updateData
      });
    });
  });

  describe('deleteOrganization', () => {
    it('should delete organization', () => {
      service.deleteOrganization('org-1').subscribe(response => {
        expect(response).toBeUndefined();
      });

      const req = httpMock.expectOne('/api/organizations/org-1');
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });

  describe('getParentOrganizations', () => {
    it('should fetch parent organizations (level 1)', () => {
      const parentOrgs = [mockParentOrg];

      service.getParentOrganizations().subscribe(orgs => {
        expect(orgs).toEqual(parentOrgs);
        expect(orgs.every(org => org.level === 1)).toBe(true);
      });

      const req = httpMock.expectOne('/api/organizations?level=1');
      expect(req.request.method).toBe('GET');
      req.flush(parentOrgs);
    });
  });

  describe('getChildOrganizations', () => {
    it('should fetch child organizations for parent', () => {
      const childOrgs = [mockChildOrg];

      service.getChildOrganizations('org-1').subscribe(orgs => {
        expect(orgs).toEqual(childOrgs);
        expect(orgs.every(org => org.parentId === 'org-1')).toBe(true);
        expect(orgs.every(org => org.level === 2)).toBe(true);
      });

      const req = httpMock.expectOne('/api/organizations?parentId=org-1');
      expect(req.request.method).toBe('GET');
      req.flush(childOrgs);
    });
  });
});
