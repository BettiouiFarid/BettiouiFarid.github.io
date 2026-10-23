#!/usr/bin/perl
# Apply local customisations to the mirrored site (safe to run more than once):
#   1. content edits (footer year, location)
#   2. fluid layout above 1440px: fixed container widths and large font sizes
#      become max(<original>, <proportional vw>), so nothing changes below 1440px.
# Usage: perl tools/customize.pl site
use strict; use warnings;
use File::Find;

my $root = shift or die "usage: customize.pl SITEDIR\n";
my $DESIGN_WIDTH = 1440;   # Framer desktop breakpoint the design was made at

sub vw { my $px = shift; sprintf("%.4gvw", $px / $DESIGN_WIDTH * 100) }

sub customise {
  my $c = shift;

  # --- Content -----------------------------------------------------------
  $c =~ s{© 2024 — Make}{© 2026 — Make}g;
  # Location appears as HTML with <br>, as a JSX children array with a br element,
  # and as plain text (extra spaces, or none at all in the search index).
  $c =~ s{Mostaganem, Oran<br class="framer-text">Alger, Algeria ?}{Doha, Qatar}g;
  $c =~ s{\[`Mostaganem, Oran`,\w+\(\w+\.br,\{\}\),`Alger, Algeria ?`\]}{`Doha, Qatar`}g;
  $c =~ s{Mostaganem, Oran,?\s*Alger, Algeria ?}{Doha, Qatar}g;

  # --- Fluid layout above 1440px -------------------------------------------
  # Container widths designed at 1000-1399px (e.g. 1208px). Skips media queries,
  # which are written as "(max-width:1439px)".
  $c =~ s{(?<![(\w-])((?:max-)?width:)(1[0-3]\d\d)px}{$1 . "max(${2}px," . vw($2) . ")"}ge;
  # Large type (32px and up) scales with the viewport on wide screens.
  $c =~ s{(--framer-font-size"?:"?)(\d+(?:\.\d+)?)px}{
    $2 >= 32 ? $1 . "max(${2}px," . vw($2) . ")" : "$1${2}px"
  }ge;

  return $c;
}

my $changed = 0;
find(sub {
  return unless -f && /\.(html|mjs|json)$/;
  open my $in, '<:raw', $_ or die "$File::Find::name: $!";
  my $orig = do { local $/; <$in> }; close $in;
  my $new = customise($orig);
  return if $new eq $orig;
  open my $out, '>:raw', $_ or die "$File::Find::name: $!"; print $out $new; close $out;
  $changed++;
}, $root);
print "updated $changed files\n";
