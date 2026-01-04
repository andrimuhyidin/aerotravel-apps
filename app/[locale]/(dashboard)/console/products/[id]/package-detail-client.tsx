'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Edit, Trash2, Eye, EyeOff, Archive, CheckCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import { logger } from '@/lib/utils/logger';

type PackageData = {
  id: string;
  code: string;
  name: string;
  slug: string;
  description: string | null;
  short_description: string | null;
  package_type: string;
  status: 'draft' | 'published' | 'archived';
  destination: string;
  city: string | null;
  province: string | null;
  duration_days: number;
  duration_nights: number;
  min_pax: number;
  max_pax: number;
  inclusions: string[] | null;
  exclusions: string[] | null;
  thumbnail_url: string | null;
  created_at: string;
  updated_at: string;
  package_prices: Array<{
    id: string;
    min_pax: number;
    max_pax: number;
    price_publish: number;
    price_nta: number;
    price_weekend: number | null;
    is_active: boolean;
  }>;
};

export function PackageDetailClient({ packageData }: { packageData: PackageData }) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <Badge className="bg-green-500">Published</Badge>;
      case 'draft':
        return <Badge variant="secondary">Draft</Badge>;
      case 'archived':
        return <Badge variant="outline">Archived</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/admin/packages/${packageData.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete package');
      }

      toast.success('Package deleted successfully');

      router.push('/console/products');
      router.refresh();
    } catch (error) {
      logger.error('Failed to delete package', error);
      toast.error('Failed to delete package');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleStatusChange = async (newStatus: 'draft' | 'published' | 'archived') => {
    setIsUpdatingStatus(true);
    try {
      const response = await fetch(`/api/admin/packages/${packageData.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      toast.success(`Package ${newStatus} successfully`);

      router.refresh();
    } catch (error) {
      logger.error('Failed to update status', error);
      toast.error('Failed to update status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{packageData.name}</h1>
          <p className="text-muted-foreground">
            {packageData.code} • {packageData.destination}
          </p>
        </div>
        <div className="flex gap-2">
          {packageData.status === 'draft' && (
            <Button
              onClick={() => handleStatusChange('published')}
              disabled={isUpdatingStatus}
            >
              <Eye className="mr-2 h-4 w-4" />
              Publish
            </Button>
          )}
          {packageData.status === 'published' && (
            <>
              <Button
                variant="outline"
                onClick={() => handleStatusChange('draft')}
                disabled={isUpdatingStatus}
              >
                <EyeOff className="mr-2 h-4 w-4" />
                Unpublish
              </Button>
              <Button
                variant="outline"
                onClick={() => handleStatusChange('archived')}
                disabled={isUpdatingStatus}
              >
                <Archive className="mr-2 h-4 w-4" />
                Archive
              </Button>
            </>
          )}
          {packageData.status === 'archived' && (
            <Button
              variant="outline"
              onClick={() => handleStatusChange('published')}
              disabled={isUpdatingStatus}
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Restore
            </Button>
          )}
          <Link href={`/console/products/${packageData.id}/edit`}>
            <Button variant="outline">
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </Link>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete the package. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Package Information</CardTitle>
            {getStatusBadge(packageData.status)}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Package Type</p>
              <p className="text-base capitalize">
                {packageData.package_type.replace(/_/g, ' ')}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Duration</p>
              <p className="text-base">
                {packageData.duration_days} Days {packageData.duration_nights} Nights
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Capacity</p>
              <p className="text-base">
                {packageData.min_pax} - {packageData.max_pax} pax
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Location</p>
              <p className="text-base">
                {packageData.city && `${packageData.city}, `}
                {packageData.province || packageData.destination}
              </p>
            </div>
          </div>

          {packageData.short_description && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">Short Description</p>
              <p className="text-base">{packageData.short_description}</p>
            </div>
          )}

          {packageData.description && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">Description</p>
              <p className="text-base whitespace-pre-wrap">{packageData.description}</p>
            </div>
          )}

          {packageData.inclusions && packageData.inclusions.length > 0 && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">Inclusions</p>
              <ul className="list-inside list-disc space-y-1">
                {packageData.inclusions.map((item, index) => (
                  <li key={index} className="text-base">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {packageData.exclusions && packageData.exclusions.length > 0 && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">Exclusions</p>
              <ul className="list-inside list-disc space-y-1">
                {packageData.exclusions.map((item, index) => (
                  <li key={index} className="text-base">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pricing Tiers</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pax Range</TableHead>
                <TableHead>Publish Price</TableHead>
                <TableHead>NTA Price</TableHead>
                <TableHead>Commission</TableHead>
                <TableHead>Weekend Price</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {packageData.package_prices
                .filter((price) => price.is_active)
                .map((price) => {
                  const commission = price.price_publish - price.price_nta;
                  const commissionPercent = ((commission / price.price_publish) * 100).toFixed(1);

                  return (
                    <TableRow key={price.id}>
                      <TableCell>
                        {price.min_pax} - {price.max_pax} pax
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatPrice(price.price_publish)}
                      </TableCell>
                      <TableCell>{formatPrice(price.price_nta)}</TableCell>
                      <TableCell>
                        {formatPrice(commission)}
                        <span className="ml-2 text-xs text-muted-foreground">
                          ({commissionPercent}%)
                        </span>
                      </TableCell>
                      <TableCell>
                        {price.price_weekend ? formatPrice(price.price_weekend) : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={price.is_active ? 'default' : 'secondary'}>
                          {price.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {packageData.thumbnail_url && (
        <Card>
          <CardHeader>
            <CardTitle>Thumbnail</CardTitle>
          </CardHeader>
          <CardContent>
            <img
              src={packageData.thumbnail_url}
              alt={packageData.name}
              className="h-auto max-w-md rounded-lg"
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

