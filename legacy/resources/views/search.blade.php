<form class="navbar-form navbar-right" action="{{ route('search') }}" method="post">
    {{ csrf_field() }}
    <div class="form-group">
        <input class="form-control" type="text" name="search">
        <button class="btn btn-default">Поиск</button>
    </div>
</form>